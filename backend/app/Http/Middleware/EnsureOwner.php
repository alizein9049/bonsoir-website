<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Owner-only areas: categories, branding and user management. */
class EnsureOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isOwner()) {
            return response()->json(['message' => 'Only the Owner can do this.'], 403);
        }

        return $next($request);
    }
}
