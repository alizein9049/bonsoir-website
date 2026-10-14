<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\AccountSetup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Owner-only user management. There must always be at least one active Owner:
 * the last one can't be disabled, deleted or changed to Menu Editor.
 */
class UserController extends Controller
{
    private function present(User $u, Request $request): array
    {
        return $u->toAdminArray() + [
            'isActive' => $u->is_active,
            'isSelf' => $u->id === $request->user()->id,
            'createdAt' => $u->created_at?->toIso8601String(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $users = User::orderByRaw("CASE WHEN role = 'owner' THEN 0 ELSE 1 END")->orderBy('name')->get();

        return response()->json(['data' => $users->map(fn (User $u) => $this->present($u, $request))->all()]);
    }

    /** Creates the account and emails a link so the person sets their own password. */
    public function store(Request $request): JsonResponse
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email'))), 'name' => trim((string) $request->input('name'))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role' => ['required', Rule::in([User::ROLE_OWNER, User::ROLE_EDITOR])],
        ], ['email.unique' => 'There is already an account with this email.']);

        $user = User::create([
            ...$data,
            'password' => Str::password(40), // unknown to anyone; replaced via the setup link
            'is_active' => true,
        ]);
        $user->notify(new AccountSetup(Password::broker()->createToken($user)));

        return response()->json(['data' => $this->present($user, $request)], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $request->merge(array_filter(['name' => is_string($request->input('name')) ? trim($request->input('name')) : null]));
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:80'],
            'role' => ['sometimes', Rule::in([User::ROLE_OWNER, User::ROLE_EDITOR])],
        ]);

        if (($data['role'] ?? $user->role) === User::ROLE_EDITOR && $user->isOwner() && $user->is_active
            && User::activeOwnerCount() <= 1) {
            return $this->lastOwner();
        }

        $user->update($data);

        return response()->json(['data' => $this->present($user, $request)]);
    }

    public function status(Request $request, User $user): JsonResponse
    {
        $data = $request->validate(['isActive' => ['required', 'boolean']]);

        if (! $data['isActive']) {
            if ($user->id === $request->user()->id) {
                return response()->json(['message' => 'You can’t disable your own account.', 'code' => 'self'], 409);
            }
            if ($user->isOwner() && $user->is_active && User::activeOwnerCount() <= 1) {
                return $this->lastOwner();
            }
        }

        $user->update(['is_active' => $data['isActive']]);
        if (! $data['isActive']) {
            // Sign the person out everywhere straight away.
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        return response()->json(['data' => $this->present($user, $request)]);
    }

    public function sendPasswordLink(User $user): JsonResponse
    {
        if (! $user->is_active) {
            return response()->json(['message' => 'Enable this account before sending a link.', 'code' => 'inactive'], 409);
        }
        $status = Password::broker()->sendResetLink(['email' => $user->email]);
        if ($status === Password::RESET_THROTTLED) {
            return response()->json([
                'message' => 'A link was sent to this person less than a minute ago. Please wait a minute before sending another.',
                'code' => 'throttled',
            ], 429);
        }

        return response()->json(['message' => "A link to set a new password has been sent to {$user->email}."]);
    }

    public function destroy(Request $request, User $user): Response|JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You can’t delete your own account.', 'code' => 'self'], 409);
        }
        if ($user->isOwner() && $user->is_active && User::activeOwnerCount() <= 1) {
            return $this->lastOwner();
        }
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->delete();

        return response()->noContent();
    }

    private function lastOwner(): JsonResponse
    {
        return response()->json([
            'message' => 'There must always be at least one active Owner. Make another person Owner first.',
            'code' => 'last_owner',
        ], 409);
    }
}
