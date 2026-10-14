<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

/** Approved brand colours; logo = the official file shipped with the website. */
class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        SiteSetting::current();
    }
}
