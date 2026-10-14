<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MediaAsset;
use App\Models\MenuItem;
use App\Support\ImageStore;
use App\Support\MenuCache;
use App\Support\Slug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Products, prices, descriptions, photos and featured flag (Owner + Menu Editor). */
class ItemController extends Controller
{
    /** Everything the dashboard needs: categories (for filters/forms) and all items. */
    public function index(): JsonResponse
    {
        $categories = Category::query()->withCount('items')->orderBy('display_order')->orderBy('id')->get();
        $items = MenuItem::query()
            ->with(['image', 'options'])
            ->join('categories', 'categories.id', '=', 'menu_items.category_id')
            ->orderBy('categories.display_order')->orderBy('menu_items.display_order')->orderBy('menu_items.id')
            ->select('menu_items.*')
            ->get();

        return response()->json(['data' => [
            'categories' => $categories->map(fn (Category $c) => CategoryController::present($c))->all(),
            'items' => $items->map(fn (MenuItem $i) => $i->toMenuArray())->all(),
        ]]);
    }

    public function show(MenuItem $item): JsonResponse
    {
        return response()->json(['data' => $item->load(['image', 'options'])->toMenuArray()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $newImage = $this->imageFrom($request, $data);

        try {
            $item = DB::transaction(function () use ($data, $request, $newImage) {
                $item = MenuItem::create([
                    'category_id' => $data['categoryId'],
                    'created_by' => $request->user()->id,
                    'name' => $data['name'],
                    'slug' => Slug::unique(MenuItem::class, $data['name']),
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'image_id' => $newImage?->id,
                    'is_featured' => $data['isFeatured'],
                    'display_order' => 0,
                ]);
                $this->syncOptions($item, $data['options']);
                $this->place($item, (int) $data['categoryId'], (int) $data['displayOrder']);

                return $item;
            });
        } catch (\Throwable $e) {
            ImageStore::deleteIfUnused($newImage); // don't leave an orphan file behind
            throw $e;
        }

        MenuCache::clear();

        return response()->json(['data' => $item->fresh(['image', 'options'])->toMenuArray()], 201);
    }

    public function update(Request $request, MenuItem $item): JsonResponse
    {
        $data = $this->validated($request);
        $oldImage = $item->image;
        $oldCategoryId = $item->category_id;
        $action = $data['imageAction'];
        $newImage = $this->imageFrom($request, $data);

        try {
            DB::transaction(function () use ($item, $data, $action, $newImage, $oldCategoryId) {
                $item->fill([
                    'category_id' => $data['categoryId'],
                    'name' => $data['name'],
                    'slug' => $item->name === $data['name'] ? $item->slug : Slug::unique(MenuItem::class, $data['name'], $item->id),
                    'description' => $data['description'],
                    'price' => $data['price'],
                    'is_featured' => $data['isFeatured'],
                ]);
                if ($action === 'replace') {
                    $item->image_id = $newImage->id;
                } elseif ($action === 'remove') {
                    $item->image_id = null;
                }
                $item->save();
                $this->syncOptions($item, $data['options']);
                $this->place($item, (int) $data['categoryId'], (int) $data['displayOrder']);
                if ($oldCategoryId !== (int) $data['categoryId']) {
                    MenuItem::renumber($oldCategoryId);
                }
            });
        } catch (\Throwable $e) {
            ImageStore::deleteIfUnused($newImage);
            throw $e;
        }

        // The old file goes only after the new state is saved, and only if nothing else uses it.
        if ($action !== 'keep') {
            ImageStore::deleteIfUnused($oldImage);
        }
        MenuCache::clear();

        return response()->json(['data' => $item->fresh(['image', 'options'])->toMenuArray()]);
    }

    public function featured(Request $request, MenuItem $item): JsonResponse
    {
        $data = $request->validate(['isFeatured' => ['required', 'boolean']]);
        $item->update(['is_featured' => $data['isFeatured']]);
        MenuCache::clear();

        return response()->json(['data' => $item->fresh(['image', 'options'])->toMenuArray()]);
    }

    public function destroy(MenuItem $item): Response
    {
        $image = $item->image;
        $categoryId = $item->category_id;
        DB::transaction(function () use ($item, $categoryId) {
            $item->delete();
            MenuItem::renumber($categoryId);
        });
        ImageStore::deleteIfUnused($image);
        MenuCache::clear();

        return response()->noContent();
    }

    // ---------------------------------------------------------------------

    private function validated(Request $request): array
    {
        // Multipart forms send everything as text: decode the options list first.
        $options = $request->input('options', '[]');
        if (is_string($options)) {
            $decoded = json_decode($options, true);
            $request->merge(['options' => is_array($decoded) ? $decoded : 'invalid']);
        }
        $description = $request->input('description');
        $request->merge([
            'name' => is_string($request->input('name')) ? preg_replace('/\s+/u', ' ', trim($request->input('name'))) : $request->input('name'),
            'description' => is_string($description) && trim($description) !== '' ? trim($description) : null,
        ]);

        $data = $request->validate([
            'categoryId' => ['required', 'integer', Rule::exists('categories', 'id')],
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:300'],
            'price' => ['required', 'string', 'regex:/^\d{1,4}(\.\d{1,2})?$/'],
            'isFeatured' => ['required', 'boolean'],
            'displayOrder' => ['required', 'integer', 'min:1'],
            'options' => ['array', 'max:20'],
            'options.*.type' => ['required', Rule::in(['flavor', 'addon'])],
            'options.*.name' => ['required', 'string', 'max:60'],
            'imageAction' => ['required', Rule::in(['keep', 'remove', 'replace'])],
            'image' => ['required_if:imageAction,replace', 'nullable', 'file', 'max:10240'],
        ], [
            'price.regex' => 'Enter a price like 3.50 (up to 9999.99).',
            'image.max' => 'The maximum photo size is 10 MB.',
            'image.required_if' => 'Choose a photo to upload.',
            'categoryId.exists' => 'The selected category no longer exists.',
        ]);

        $data['price'] = number_format((float) $data['price'], 2, '.', '');
        $data['options'] = $data['options'] ?? [];

        return $data;
    }

    private function imageFrom(Request $request, array $data): ?MediaAsset
    {
        if ($data['imageAction'] !== 'replace') {
            return null;
        }
        $file = $request->file('image');
        if (! $file) {
            throw ValidationException::withMessages(['image' => 'Choose a photo to upload.']);
        }

        return ImageStore::fromUpload($file, $request->user()->id, 'image');
    }

    private function syncOptions(MenuItem $item, array $options): void
    {
        $item->options()->delete();
        foreach (array_values($options) as $i => $o) {
            $item->options()->create(['type' => $o['type'], 'name' => trim($o['name']), 'display_order' => $i + 1]);
        }
    }

    /** Puts the item at a 1-based position inside its category and renumbers the rest. */
    private function place(MenuItem $item, int $categoryId, int $position): void
    {
        $others = MenuItem::where('category_id', $categoryId)->whereKeyNot($item->id)
            ->orderBy('display_order')->orderBy('id')->pluck('id')->all();
        $index = max(0, min($position - 1, count($others)));
        array_splice($others, $index, 0, [$item->id]);
        foreach ($others as $i => $id) {
            MenuItem::whereKey($id)->update(['display_order' => $i + 1]);
        }
    }
}
