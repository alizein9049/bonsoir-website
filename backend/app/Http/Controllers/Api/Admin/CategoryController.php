<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\MenuCache;
use App\Support\Slug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Owner-only: create, rename, show/hide, reorder and delete categories. */
class CategoryController extends Controller
{
    public static function present(Category $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'displayOrder' => $c->display_order,
            'isVisible' => $c->is_visible,
            'itemCount' => (int) ($c->items_count ?? $c->items()->count()),
        ];
    }

    public function index(): JsonResponse
    {
        $categories = Category::withCount('items')->orderBy('display_order')->orderBy('id')->get();

        return response()->json(['data' => $categories->map(fn ($c) => static::present($c))->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = $this->validatedName($request);
        $category = Category::create([
            'name' => $name,
            'slug' => Slug::unique(Category::class, $name, null, 'category'),
            'display_order' => (int) Category::max('display_order') + 1,
            'is_visible' => true,
        ]);
        MenuCache::clear();

        return response()->json(['data' => static::present($category->loadCount('items'))], 201);
    }

    /** Rename and/or show-hide. The slug is kept so links and placeholders don't change. */
    public function update(Request $request, Category $category): JsonResponse
    {
        $request->validate(['isVisible' => ['sometimes', 'boolean']]);
        if ($request->has('name')) {
            $category->name = $this->validatedName($request, $category->id);
        }
        if ($request->has('isVisible')) {
            $category->is_visible = $request->boolean('isVisible');
        }
        $category->save();
        MenuCache::clear();

        return response()->json(['data' => static::present($category->loadCount('items'))]);
    }

    /** Full new order: { ids: [3, 1, 2, ...] } — must list every category exactly once. */
    public function order(Request $request): JsonResponse
    {
        $all = Category::pluck('id')->sort()->values()->all();
        $data = $request->validate([
            'ids' => ['required', 'array', 'size:'.count($all)],
            'ids.*' => ['integer', 'distinct', Rule::in($all)],
        ], ['ids.size' => 'The category list changed. Please reload and try again.']);

        DB::transaction(function () use ($data) {
            foreach ($data['ids'] as $i => $id) {
                Category::whereKey($id)->update(['display_order' => $i + 1]);
            }
        });
        MenuCache::clear();

        return $this->index();
    }

    public function destroy(Category $category): Response|JsonResponse
    {
        $count = $category->items()->count();
        if ($count > 0) {
            return response()->json([
                'message' => "“{$category->name}” still has {$count} item".($count === 1 ? '' : 's').'. Move or delete them first.',
                'code' => 'not_empty',
            ], 409);
        }
        $category->delete();
        Category::renumber();
        MenuCache::clear();

        return response()->noContent();
    }

    private function validatedName(Request $request, ?int $exceptId = null): string
    {
        $raw = $request->input('name');
        $request->merge(['name' => is_string($raw) ? preg_replace('/\s+/u', ' ', trim($raw)) : $raw]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40'],
        ], [
            'name.required' => 'Enter a category name.',
            'name.max' => 'Keep the name under 40 characters.',
        ]);

        $clash = Category::query()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($data['name'])])
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->first();
        if ($clash) {
            abort(response()->json([
                'message' => "There is already a category called “{$clash->name}”.",
                'code' => 'duplicate',
            ], 409));
        }

        return $data['name'];
    }
}
