<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Slug
{
    /**
     * A unique slug for $name in the model's table: "tea-pot", then "tea-pot-2", ...
     *
     * @param  class-string<Model>  $model
     */
    public static function unique(string $model, string $name, ?int $exceptId = null, string $fallback = 'item'): string
    {
        $base = Str::slug($name) ?: $fallback;
        $base = Str::limit($base, 90, '');
        $slug = $base;

        for ($n = 2; static::taken($model, $slug, $exceptId); $n++) {
            $slug = "{$base}-{$n}";
        }

        return $slug;
    }

    private static function taken(string $model, string $slug, ?int $exceptId): bool
    {
        return $model::query()
            ->where('slug', $slug)
            ->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))
            ->exists();
    }
}
