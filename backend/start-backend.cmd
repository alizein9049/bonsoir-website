@echo off
REM Bonsoir API for local development: http://127.0.0.1:8000  (keep this window open, Ctrl+C to stop)
REM Same as "php artisan serve", plus the PHP limits needed for 10 MB photo uploads and Xdebug off for speed.
cd /d "%~dp0public"
echo Bonsoir API running on http://127.0.0.1:8000
php -d upload_max_filesize=12M -d post_max_size=14M -d memory_limit=512M -d max_execution_time=60 -d xdebug.mode=off -S 127.0.0.1:8000 "%~dp0vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php"
