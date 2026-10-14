<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\ItemController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicMenuController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ---- Customer menu (public) ----
    Route::get('menu', [PublicMenuController::class, 'menu']);
    Route::get('settings/public', [PublicMenuController::class, 'settings']);

    // ---- Admin authentication ----
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::get('auth/me', [AuthController::class, 'me']); // { data: null } when signed out (no console error)
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:10,1');

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::prefix('admin')->group(function () {
            // Owner + Menu Editor: products, prices, descriptions, photos, featured
            Route::get('items', [ItemController::class, 'index']);
            Route::post('items', [ItemController::class, 'store']);
            Route::get('items/{item}', [ItemController::class, 'show']);
            Route::patch('items/{item}', [ItemController::class, 'update']);
            Route::patch('items/{item}/featured', [ItemController::class, 'featured']);
            Route::delete('items/{item}', [ItemController::class, 'destroy']);

            // Owner only
            Route::middleware('owner')->group(function () {
                Route::get('categories', [CategoryController::class, 'index']);
                Route::post('categories', [CategoryController::class, 'store']);
                Route::patch('categories/order', [CategoryController::class, 'order']);
                Route::patch('categories/{category}', [CategoryController::class, 'update']);
                Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

                Route::get('settings', [SettingsController::class, 'show']);
                Route::post('settings/branding', [SettingsController::class, 'branding']);

                Route::get('users', [UserController::class, 'index']);
                Route::post('users', [UserController::class, 'store']);
                Route::patch('users/{user}', [UserController::class, 'update']);
                Route::patch('users/{user}/status', [UserController::class, 'status']);
                Route::post('users/{user}/password-link', [UserController::class, 'sendPasswordLink']);
                Route::delete('users/{user}', [UserController::class, 'destroy']);
            });
        });
    });
});
