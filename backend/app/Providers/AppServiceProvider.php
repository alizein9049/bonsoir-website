<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Password links open the React admin page, not a Laravel view.
        ResetPassword::createUrlUsing(function (object $user, string $token) {
            return rtrim(config('bonsoir.frontend_url'), '/').'/admin/reset-password?'.http_build_query([
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]);
        });
    }
}
