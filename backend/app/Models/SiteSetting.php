<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Single row of Owner-editable branding. */
class SiteSetting extends Model
{
    public const DEFAULT_PRIMARY = '#32000C';

    public const DEFAULT_SECONDARY = '#3F6A2E';

    protected $fillable = ['logo_media_id', 'primary_color', 'secondary_color', 'updated_by'];

    public static function current(): self
    {
        return static::query()->first() ?? static::create([
            'primary_color' => self::DEFAULT_PRIMARY,
            'secondary_color' => self::DEFAULT_SECONDARY,
        ]);
    }

    public function logo(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'logo_media_id');
    }

    public function toPublicArray(): array
    {
        return [
            'logoUrl' => $this->logo?->url(),
            'primaryColor' => strtoupper($this->primary_color),
            'secondaryColor' => strtoupper($this->secondary_color),
        ];
    }
}
