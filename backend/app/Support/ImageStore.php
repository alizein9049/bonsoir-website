<?php

namespace App\Support;

use App\Models\MediaAsset;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Stores uploaded photos: checks the real file content, resizes and saves
 * an optimised WebP copy under storage/app/public/media.
 */
class ImageStore
{
    public const MAX_BYTES = 10 * 1024 * 1024;

    public const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

    /** Validation message shared by every upload field. */
    public static function rejectMessage(string $mime): string
    {
        if (in_array($mime, ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'], true)) {
            return 'iPhone HEIC photos are not supported. Please choose a JPEG, PNG or WebP photo '
                .'(on iPhone: Settings → Camera → Formats → Most Compatible).';
        }

        return 'Please choose a JPEG, PNG or WebP photo.';
    }

    public static function fromUpload(UploadedFile $file, ?int $userId, string $field, int $maxWidth = 1200): MediaAsset
    {
        if (! $file->isValid()) {
            throw ValidationException::withMessages([$field => 'The photo could not be uploaded. Please try again.']);
        }
        if ($file->getSize() > self::MAX_BYTES) {
            throw ValidationException::withMessages([$field => 'The maximum photo size is 10 MB.']);
        }

        $bytes = file_get_contents($file->getRealPath());

        return static::fromBytes($bytes, $userId, $field, $file->getClientOriginalName(), null, $maxWidth);
    }

    public static function fromBytes(string $bytes, ?int $userId, string $field, ?string $originalName = null, ?string $sourceUrl = null, int $maxWidth = 1200): MediaAsset
    {
        // Trust the bytes, not the file name or the browser's claimed type.
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes) ?: 'application/octet-stream';
        if (! in_array($mime, self::ALLOWED, true)) {
            throw ValidationException::withMessages([$field => static::rejectMessage($mime)]);
        }

        @ini_set('memory_limit', '512M'); // large phone photos need room to decode
        $source = @imagecreatefromstring($bytes);
        if ($source === false) {
            throw ValidationException::withMessages([$field => 'This photo seems to be damaged. Please choose another one.']);
        }

        $source = static::applyExifRotation($source, $bytes, $mime);
        $w = imagesx($source);
        $h = imagesy($source);
        $scale = min(1, $maxWidth / $w);
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $canvas = imagecreatetruecolor($nw, $nh);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($source);

        $webp = function_exists('imagewebp');
        ob_start();
        $webp ? imagewebp($canvas, null, 80) : imagejpeg($canvas, null, 82);
        $encoded = ob_get_clean();
        imagedestroy($canvas);

        $path = 'media/'.Str::uuid().($webp ? '.webp' : '.jpg');
        Storage::disk('public')->put($path, $encoded);

        return MediaAsset::create([
            'path' => $path,
            'original_name' => $originalName ? Str::limit($originalName, 250, '') : null,
            'mime_type' => $webp ? 'image/webp' : 'image/jpeg',
            'size_bytes' => strlen($encoded),
            'width' => $nw,
            'height' => $nh,
            'source_url' => $sourceUrl,
            'uploaded_by' => $userId,
        ]);
    }

    /** Removes the file and its record — only when nothing uses it any more. */
    public static function deleteIfUnused(?MediaAsset $asset): void
    {
        if (! $asset || ! $asset->isUnreferenced()) {
            return;
        }
        Storage::disk('public')->delete($asset->path);
        $asset->delete();
    }

    /** Phone JPEGs are often stored sideways with an EXIF rotation flag. */
    private static function applyExifRotation(\GdImage $img, string $bytes, string $mime): \GdImage
    {
        if ($mime !== 'image/jpeg' || ! function_exists('exif_read_data')) {
            return $img;
        }
        $exif = @exif_read_data('data://image/jpeg;base64,'.base64_encode($bytes));
        $angle = match ((int) ($exif['Orientation'] ?? 1)) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        return $angle ? (imagerotate($img, $angle, 0) ?: $img) : $img;
    }
}
