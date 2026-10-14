<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    protected $fillable = [
        'category_id', 'created_by', 'name', 'slug', 'description', 'price', 'image_id', 'is_featured', 'display_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_featured' => 'boolean',
            'display_order' => 'integer',
            'category_id' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'image_id');
    }

    public function options(): HasMany
    {
        return $this->hasMany(ItemOption::class)->orderBy('display_order')->orderBy('id');
    }

    /** Same JSON shape the React app uses (types/menu.ts → MenuItem). */
    public function toMenuArray(): array
    {
        return [
            'id' => $this->id,
            'categoryId' => $this->category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (string) $this->price,
            'imageUrl' => $this->image?->url(),
            'isFeatured' => $this->is_featured,
            'displayOrder' => $this->display_order,
            'options' => $this->options->map(fn (ItemOption $o) => [
                'id' => $o->id,
                'type' => $o->type,
                'name' => $o->name,
            ])->values()->all(),
        ];
    }

    /** Re-number the items of one category 1..n in their current order. */
    public static function renumber(int $categoryId): void
    {
        static::where('category_id', $categoryId)->orderBy('display_order')->orderBy('id')->get()
            ->each(function (MenuItem $item, int $i) {
                if ($item->display_order !== $i + 1) {
                    $item->forceFill(['display_order' => $i + 1])->saveQuietly();
                }
            });
    }
}
