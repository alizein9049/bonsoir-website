<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * LOCAL TESTING ONLY. Creates (or removes with --remove) two throw-away accounts
 * used to test the dashboard: owner-test@bonsoir.test and editor-test@bonsoir.test.
 * Random passwords are written to storage/app/private/test-accounts.txt (never committed).
 */
class TestAccounts extends Command
{
    protected $signature = 'bonsoir:test-accounts {--remove : Delete the test accounts and the password file}';

    protected $description = 'LOCAL ONLY: create or remove throw-away Owner/Editor test accounts';

    private const ACCOUNTS = [
        'owner-test@bonsoir.test' => ['Test Owner', User::ROLE_OWNER],
        'editor-test@bonsoir.test' => ['Test Editor', User::ROLE_EDITOR],
    ];

    public function handle(): int
    {
        if (! app()->environment('local')) {
            $this->error('Only available when APP_ENV=local.');

            return self::FAILURE;
        }

        if ($this->option('remove')) {
            $ids = User::whereIn('email', array_keys(self::ACCOUNTS))->pluck('id');
            DB::table('sessions')->whereIn('user_id', $ids)->delete();
            User::whereIn('id', $ids)->delete();
            Storage::disk('local')->delete('test-accounts.txt');
            $this->info("Removed {$ids->count()} test account(s).");

            return self::SUCCESS;
        }

        $lines = [];
        foreach (self::ACCOUNTS as $email => [$name, $role]) {
            $password = Str::password(16, symbols: false);
            User::updateOrCreate(['email' => $email], ['name' => $name, 'role' => $role, 'is_active' => true, 'password' => $password]);
            $lines[] = "{$email} {$password}";
        }
        Storage::disk('local')->put('test-accounts.txt', implode(PHP_EOL, $lines).PHP_EOL);
        $this->info('Test accounts ready. Passwords saved in storage/app/private/test-accounts.txt');

        return self::SUCCESS;
    }
}
