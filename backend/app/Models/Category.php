<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'display_order', 'is_visible'];

    protected function casts(): array
    {
        return ['is_visible' => 'boolean', 'display_order' => 'integer'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('display_order')->orderBy('id');
    }

    /** Re-number all categories 1..n in their current order. */
    public static function renumber(): void
    {
        static::orderBy('display_order')->orderBy('id')->get()
            ->each(function (Category $c, int $i) {
                if ($c->display_order !== $i + 1) {
                    $c->forceFill(['display_order' => $i + 1])->saveQuietly();
                }
            });
    }
}
