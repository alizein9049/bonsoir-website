<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 80);
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();   // null = pending wording, never invented
            $table->decimal('price', 8, 2);
            $table->foreignId('image_id')->nullable()->constrained('media_assets')->restrictOnDelete();
            $table->boolean('is_featured')->default(false)->index();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['category_id', 'display_order']);
        });

        Schema::create('item_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained('menu_items')->cascadeOnDelete();
            $table->enum('type', ['flavor', 'addon']);
            $table->string('name', 60);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_options');
        Schema::dropIfExists('menu_items');
    }
};
