<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A single row holding the Owner-editable branding.
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('logo_media_id')->nullable()->constrained('media_assets')->restrictOnDelete();
            $table->char('primary_color', 7)->default('#32000C');
            $table->char('secondary_color', 7)->default('#3F6A2E');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
