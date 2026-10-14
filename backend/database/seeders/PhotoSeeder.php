<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Support\ImageStore;
use App\Support\MenuCache;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

/**
 * Adds free-licence stock photos (Pexels / Unsplash licences: free to use, no
 * attribution required) to PREPARED items only — see data/photos.json.
 * Branded packaged products keep their placeholder.
 *
 * Never touches a photo the Owner uploaded. Items with no photo get one; items that
 * still show an older stock photo get the one now listed. A failed download simply
 * leaves the current picture (or the placeholder).
 * Run: php artisan db:seed --class=PhotoSeeder   (needs an internet connection)
 */
class PhotoSeeder extends Seeder
{
    public function run(): void
    {
        $photos = json_decode(file_get_contents(__DIR__.'/data/photos.json'), true, flags: JSON_THROW_ON_ERROR);
        $cache = [];
        $added = 0;

        foreach ($photos['items'] as $slug => $photo) {
            $item = MenuItem::where('slug', $slug)->first();
            if (! $item) {
                $this->command?->warn("  skipped {$slug}: item not found");

                continue;
            }
            $current = $item->image;
            if ($current && ($current->source_url === null || $current->source_url === $photo['source'])) {
                continue; // Owner-uploaded photo, or already the listed stock photo
            }

            try {
                // Items sharing the same picture share one stored file.
                $asset = $cache[$photo['url']] ??= ImageStore::fromBytes(
                    Http::withOptions(['verify' => $this->caBundle()])->timeout(30)->retry(2, 1000)->get($photo['url'])->throw()->body(),
                    null,
                    'image',
                    basename(parse_url($photo['url'], PHP_URL_PATH)),
                    $photo['source'],
                    900,
                );
                $item->update(['image_id' => $asset->id]);
                ImageStore::deleteIfUnused($current);
                $added++;
                $this->command?->line("  added photo: {$item->name}");
            } catch (\Throwable $e) {
                $this->command?->warn("  no photo for {$item->name} (placeholder kept): ".$e->getMessage());
            }
        }

        // A stock photo that is no longer listed (judged unsuitable) goes back to the placeholder.
        $removed = 0;
        MenuItem::with('image')->whereNotIn('slug', array_keys($photos['items']))->whereNotNull('image_id')->get()
            ->each(function (MenuItem $item) use (&$removed) {
                $old = $item->image;
                if ($old && $old->source_url !== null) {
                    $item->update(['image_id' => null]);
                    ImageStore::deleteIfUnused($old);
                    $removed++;
                    $this->command?->line("  removed stock photo: {$item->name} (placeholder)");
                }
            });

        MenuCache::clear();
        $this->command?->info("Photos added: {$added}".($removed ? ", removed: {$removed}" : ''));
    }

    /**
     * WAMP's PHP ships without a CA certificate list, so HTTPS downloads fail with
     * "cURL error 60". Use PHP's own setting when present, else the Mozilla bundle
     * stored next to this seeder. Certificate checks always stay switched on.
     */
    private function caBundle(): string|bool
    {
        foreach ([ini_get('curl.cainfo'), ini_get('openssl.cafile')] as $configured) {
            if ($configured && is_file($configured)) {
                return true;
            }
        }

        return __DIR__.'/data/cacert.pem';
    }
}
