<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

/** Admin sign-in with a Sanctum cookie session (CSRF protected). */
class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        $key = Str::lower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            return response()->json([
                'message' => 'Too many sign-in attempts. Please wait a minute and try again.',
                'retryAfter' => RateLimiter::availableIn($key),
            ], 429);
        }

        $user = User::where('email', Str::lower($data['email']))->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['email' => 'Incorrect email or password.']);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'This account has been disabled. Please contact the Owner.',
                'code' => 'account_disabled',
            ], 403);
        }

        RateLimiter::clear($key);
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json(['data' => $user->toAdminArray()]);
    }

    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /** The signed-in admin, or null. Disabled accounts are signed out here too. */
    public function me(Request $request): JsonResponse
    {
        $user = Auth::guard('web')->user();
        if ($user && ! $user->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            $user = null;
        }

        return response()->json(['data' => $user?->toAdminArray()]);
    }

    /** Always answers the same way, so it never reveals which emails exist. */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'string', 'email', 'max:255']]);
        $email = Str::lower($data['email']);

        $key = 'forgot|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json(['message' => 'Too many requests. Please wait a minute and try again.'], 429);
        }
        RateLimiter::hit($key, 60);

        if (User::where('email', $email)->where('is_active', true)->exists()) {
            Password::sendResetLink(['email' => $email]);
        }

        return response()->json([
            'message' => 'If an active account uses this email, a link to set a new password has been sent.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', 'max:255', PasswordRule::min(10)->letters()],
        ]);

        $status = Password::reset(
            [...$data, 'email' => Str::lower($data['email'])],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => 'This link is invalid or has expired. Please ask for a new one.',
            ]);
        }

        return response()->json(['message' => 'Your password has been saved. You can now sign in.']);
    }
}
