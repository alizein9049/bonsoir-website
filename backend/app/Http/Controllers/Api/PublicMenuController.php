<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\SiteSetting;
use App\Support\MenuCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/** Customer menu — visible categories only, everything in display order. */
class PublicMenuController extends Controller
{
    public function menu(): JsonResponse
    {
        $payload = Cache::rememberForever(MenuCache::KEY, function () {
            $categories = Category::query()
                ->where('is_visible', true)
                ->orderBy('display_order')->orderBy('id')
                ->with(['items.image', 'items.options'])
                ->get();

            return [
                'categories' => $categories->map(fn (Category $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'displayOrder' => $c->display_order,
                    'items' => $c->items->map(fn (MenuItem $i) => $i->toMenuArray())->values()->all(),
                ])->values()->all(),
            ];
        });

        return response()->json(['data' => $payload]);
    }

    public function settings(): JsonResponse
    {
        $payload = Cache::rememberForever(
            MenuCache::SETTINGS_KEY,
            fn () => SiteSetting::current()->load('logo')->toPublicArray(),
        );

        return response()->json(['data' => $payload]);
    }
}
