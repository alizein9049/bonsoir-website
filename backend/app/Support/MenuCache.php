<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * The public menu is cached; every admin change calls MenuCache::clear()
 * so the customer menu always shows what is saved in the database.
 */
class MenuCache
{
    public const KEY = 'bonsoir.public-menu.v1';

    public const SETTINGS_KEY = 'bonsoir.public-settings.v1';

    public static function clear(): void
    {
        Cache::forget(self::KEY);
        Cache::forget(self::SETTINGS_KEY);
    }
}
