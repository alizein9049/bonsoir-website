<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Menu content from the approved PDF + default branding.
     * No admin accounts are seeded: run `php artisan bonsoir:create-owner`.
     * Stock photos are a separate step: `php artisan db:seed --class=PhotoSeeder`.
     */
    public function run(): void
    {
        $this->call([
            MenuSeeder::class,
            SiteSettingSeeder::class,
        ]);
    }
}
