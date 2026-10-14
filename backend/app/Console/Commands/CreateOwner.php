<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Creates (or restores) an Owner account. The password is typed by the Owner
 * in the terminal — it is never stored in code or files.
 */
class CreateOwner extends Command
{
    protected $signature = 'bonsoir:create-owner';

    protected $description = 'Create a Bonsoir Owner account (asks for name, email and password)';

    public function handle(): int
    {
        $name = text('Owner name', required: true, validate: fn ($v) => mb_strlen(trim($v)) > 80 ? 'Max 80 characters.' : null);
        $email = Str::lower(trim(text('Owner email', required: true, validate: fn ($v) => Validator::make(['e' => trim($v)], ['e' => 'email'])->fails() ? 'Enter a valid email.' : null)));
        $pass = password('Password (at least 10 characters, typing is hidden)', required: true, validate: fn ($v) => Validator::make(['p' => $v], ['p' => [Password::min(10)->letters()]])->fails() ? 'Use at least 10 characters including letters.' : null);
        $confirm = password('Repeat the password', required: true);

        if ($pass !== $confirm) {
            $this->error('The two passwords are different. Nothing was saved — please run the command again.');

            return self::FAILURE;
        }

        $user = User::firstOrNew(['email' => $email]);
        $existed = $user->exists;
        $user->fill(['name' => trim($name), 'password' => $pass, 'role' => User::ROLE_OWNER, 'is_active' => true])->save();

        $this->info($existed ? "Updated {$email}: now an active Owner with the new password." : "Owner account created for {$email}.");

        return self::SUCCESS;
    }
}
