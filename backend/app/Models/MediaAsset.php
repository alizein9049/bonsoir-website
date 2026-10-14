<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MediaAsset extends Model
{
    protected $fillable = [
        'path', 'original_name', 'mime_type', 'size_bytes', 'width', 'height', 'source_url', 'uploaded_by',
    ];

    /** Public URL relative to the site root, e.g. /storage/media/abc.webp */
    public function url(): string
    {
        return '/'.ltrim(parse_url(Storage::disk('public')->url($this->path), PHP_URL_PATH), '/');
    }

    /** True when nothing (menu item or logo) points at this file any more. */
    public function isUnreferenced(): bool
    {
        return ! MenuItem::where('image_id', $this->id)->exists()
            && ! SiteSetting::where('logo_media_id', $this->id)->exists();
    }
}
