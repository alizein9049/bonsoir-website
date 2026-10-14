<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
use App\Support\MenuCache;
use Illuminate\Database\Seeder;

/**
 * The 9 categories and 60 items transcribed exactly from the approved menu PDF
 * (database/seeders/data/menu.json). Pending descriptions stay empty (null).
 * Safe to re-run: it only fills an empty menu.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        if (Category::exists() || MenuItem::exists()) {
            $this->command?->warn('Menu already has data — MenuSeeder skipped (nothing changed).');

            return;
        }

        $menu = json_decode(file_get_contents(__DIR__.'/data/menu.json'), true, flags: JSON_THROW_ON_ERROR);

        foreach ($menu['categories'] as $c => $category) {
            $model = Category::create([
                'name' => $category['name'],
                'slug' => $category['slug'],
                'display_order' => $c + 1,
                'is_visible' => true,
            ]);
            foreach ($category['items'] as $i => $item) {
                MenuItem::create([
                    'category_id' => $model->id,
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'is_featured' => false,
                    'display_order' => $i + 1,
                ]);
            }
        }

        MenuCache::clear();
    }
}
