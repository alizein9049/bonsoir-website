<?php

use App\Http\Middleware\EnsureActive;
use App\Http\Middleware\EnsureOwner;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Cookie session + CSRF for the React admin (Sanctum SPA authentication).
        $middleware->statefulApi();
        $middleware->alias([
            'owner' => EnsureOwner::class,
            'active' => EnsureActive::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // The API always answers in JSON (never an HTML error page).
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );
        // Don't reveal internal model names in "not found" answers.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Not found. It may have been deleted.'], 404);
            }
        });
    })->create();
