<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\User;
use App\Notifications\AccountSetup;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BonsoirApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Storage::fake('public');
        // Behave like the React app (same-origin SPA → cookie session).
        $this->withHeaders(['Origin' => 'http://localhost', 'Accept' => 'application/json']);
    }

    private function owner(array $attrs = []): User
    {
        return User::factory()->create($attrs + ['role' => 'owner', 'is_active' => true]);
    }

    private function editor(array $attrs = []): User
    {
        return User::factory()->create($attrs + ['role' => 'editor', 'is_active' => true]);
    }

    private function itemPayload(array $over = []): array
    {
        return array_merge([
            'categoryId' => Category::where('slug', 'smoothies')->value('id'),
            'name' => 'Test Smoothie',
            'description' => 'Test description',
            'price' => '4.5',
            'isFeatured' => '0',
            'displayOrder' => '1',
            'options' => '[]',
            'imageAction' => 'keep',
        ], $over);
    }

    private function publicItems(): array
    {
        return collect($this->getJson('/api/v1/menu')->json('data.categories'))->flatMap(fn ($c) => $c['items'])->all();
    }

    // ---------------- Seed data ----------------

    public function test_seed_matches_the_approved_pdf(): void
    {
        $res = $this->getJson('/api/v1/menu')->assertOk();
        $cats = $res->json('data.categories');

        $this->assertSame(
            ['Smoothies', 'Hot Drinks', 'Cold Drinks', 'Beverages', 'Milkshakes', 'Chips/Treats', 'Dessert', 'Sajj', 'Shisha'],
            array_column($cats, 'name'),
        );
        $this->assertCount(60, $this->publicItems());

        $tea = MenuItem::where('slug', 'tea')->first();
        $this->assertSame('1.50', $tea->toMenuArray()['price']);
        $this->assertNull(MenuItem::where('slug', 'tiramisu')->value('description'));
        $this->assertSame('Classic saj topped with aromatic zaatar.', MenuItem::where('slug', 'zaatar')->value('description'));
        $this->assertSame(0, User::count(), 'no admin accounts are seeded');
    }

    // ---------------- Authentication ----------------

    public function test_login_me_logout(): void
    {
        $owner = $this->owner(['email' => 'boss@example.com', 'password' => 'CorrectHorse1']);

        $this->postJson('/api/v1/auth/login', ['email' => 'boss@example.com', 'password' => 'wrong-password'])
            ->assertStatus(422)->assertJsonPath('errors.email.0', 'Incorrect email or password.');

        $this->postJson('/api/v1/auth/login', ['email' => 'BOSS@example.com', 'password' => 'CorrectHorse1'])
            ->assertOk()->assertJsonPath('data.role', 'owner');

        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.id', $owner->id);
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data', null);
    }

    public function test_login_is_rate_limited_after_five_failures(): void
    {
        $this->owner(['email' => 'boss@example.com']);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'boss@example.com', 'password' => 'nope'])->assertStatus(422);
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'boss@example.com', 'password' => 'nope'])->assertStatus(429);
    }

    public function test_disabled_account_cannot_sign_in_or_keep_using_the_api(): void
    {
        $this->editor(['email' => 'ed@example.com', 'password' => 'CorrectHorse1', 'is_active' => false]);
        $this->postJson('/api/v1/auth/login', ['email' => 'ed@example.com', 'password' => 'CorrectHorse1'])
            ->assertStatus(403)->assertJsonPath('code', 'account_disabled');

        $ed2 = $this->editor(['is_active' => false]);
        $this->actingAs($ed2)->getJson('/api/v1/admin/items')->assertStatus(403);
    }

    public function test_guests_cannot_use_admin_endpoints(): void
    {
        $this->getJson('/api/v1/admin/items')->assertUnauthorized();
        $this->postJson('/api/v1/admin/items', $this->itemPayload())->assertUnauthorized();
        $this->getJson('/api/v1/admin/categories')->assertUnauthorized();
    }

    public function test_forgot_password_does_not_reveal_accounts_and_reset_works(): void
    {
        Notification::fake();
        $owner = $this->owner(['email' => 'boss@example.com']);

        $a = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'boss@example.com'])->assertOk()->json('message');
        $b = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk()->json('message');
        $this->assertSame($a, $b);

        $token = null;
        Notification::assertSentTo($owner, ResetPassword::class, function ($n) use (&$token, $owner) {
            $token = $n->token;
            $this->assertStringStartsWith('http://localhost:5173/admin/reset-password?token=', $n->toMail($owner)->actionUrl);

            return true;
        });

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token, 'email' => 'boss@example.com', 'password' => 'NewPassword1', 'password_confirmation' => 'NewPassword1',
        ])->assertOk();
        $this->postJson('/api/v1/auth/login', ['email' => 'boss@example.com', 'password' => 'NewPassword1'])->assertOk();

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'bad', 'email' => 'boss@example.com', 'password' => 'NewPassword2', 'password_confirmation' => 'NewPassword2',
        ])->assertStatus(422)->assertJsonValidationErrors('token');
    }

    // ---------------- Items: dashboard ↔ public menu sync ----------------

    public function test_editor_creates_edits_features_and_deletes_items_and_public_menu_follows(): void
    {
        $ed = $this->editor();
        $this->actingAs($ed);
        $this->getJson('/api/v1/menu')->assertOk(); // warm the cache

        $id = $this->post('/api/v1/admin/items', $this->itemPayload())->assertCreated()
            ->assertJsonPath('data.price', '4.50')->assertJsonPath('data.displayOrder', 1)->json('data.id');
        $this->assertContains('Test Smoothie', array_column($this->publicItems(), 'name'));
        $this->assertSame(2, MenuItem::where('slug', 'strawberry-smoothie')->value('display_order'), 'others shift down');

        $this->post("/api/v1/admin/items/{$id}", $this->itemPayload(['_method' => 'PATCH', 'name' => 'Renamed Smoothie', 'price' => '6', 'description' => '', 'displayOrder' => '3']))
            ->assertOk()->assertJsonPath('data.price', '6.00')->assertJsonPath('data.description', null)->assertJsonPath('data.displayOrder', 3);
        $pub = collect($this->publicItems())->firstWhere('id', $id);
        $this->assertSame(['Renamed Smoothie', '6.00', null], [$pub['name'], $pub['price'], $pub['description']]);

        $this->patchJson("/api/v1/admin/items/{$id}/featured", ['isFeatured' => true])->assertOk();
        $this->assertTrue(collect($this->publicItems())->firstWhere('id', $id)['isFeatured']);

        $this->deleteJson("/api/v1/admin/items/{$id}")->assertNoContent();
        $this->assertNull(collect($this->publicItems())->firstWhere('id', $id));
        $this->assertSame(range(1, 6), MenuItem::where('category_id', Category::where('slug', 'smoothies')->value('id'))->orderBy('display_order')->pluck('display_order')->all());
        $this->deleteJson("/api/v1/admin/items/{$id}")->assertNotFound()->assertJsonMissing(['App\\Models\\MenuItem']);
    }

    public function test_item_validation(): void
    {
        $this->actingAs($this->editor());
        foreach (['-1', '10000', '1.234', 'abc', ''] as $bad) {
            $this->post('/api/v1/admin/items', $this->itemPayload(['price' => $bad]))->assertStatus(422)->assertJsonValidationErrors('price');
        }
        $this->post('/api/v1/admin/items', $this->itemPayload(['name' => '  ']))->assertStatus(422)->assertJsonValidationErrors('name');
        $this->post('/api/v1/admin/items', $this->itemPayload(['name' => str_repeat('a', 81)]))->assertStatus(422);
        $this->post('/api/v1/admin/items', $this->itemPayload(['description' => str_repeat('a', 301)]))->assertStatus(422);
        $this->post('/api/v1/admin/items', $this->itemPayload(['categoryId' => 9999]))->assertStatus(422);
        $this->post('/api/v1/admin/items', $this->itemPayload(['options' => json_encode([['type' => 'size', 'name' => 'x']])]))->assertStatus(422);
    }

    public function test_photo_upload_replace_and_remove(): void
    {
        $this->actingAs($this->editor());
        $id = MenuItem::where('slug', 'mango-smoothie')->value('id');
        $base = $this->itemPayload(['_method' => 'PATCH', 'name' => 'Mango Smoothie', 'description' => 'A refreshing glass of mango Smoothie .', 'price' => '5', 'displayOrder' => '2']);

        $url1 = $this->post("/api/v1/admin/items/{$id}", array_merge($base, ['imageAction' => 'replace', 'image' => UploadedFile::fake()->image('a.jpg', 2400, 1600)]))
            ->assertOk()->json('data.imageUrl');
        $this->assertMatchesRegularExpression('#^/storage/media/[0-9a-f-]+\.(webp|jpg)$#', $url1);
        $path1 = substr($url1, strlen('/storage/'));
        Storage::disk('public')->assertExists($path1);
        [$w] = getimagesizefromstring(Storage::disk('public')->get($path1));
        $this->assertSame(1200, $w, 'resized to max 1200px wide');
        $this->assertSame($url1, collect($this->publicItems())->firstWhere('id', $id)['imageUrl']);

        $url2 = $this->post("/api/v1/admin/items/{$id}", array_merge($base, ['imageAction' => 'replace', 'image' => UploadedFile::fake()->image('b.png', 300, 300)]))->assertOk()->json('data.imageUrl');
        $this->assertNotSame($url1, $url2);
        Storage::disk('public')->assertMissing($path1); // old file removed after the new one was saved

        $this->post("/api/v1/admin/items/{$id}", array_merge($base, ['imageAction' => 'remove']))->assertOk()->assertJsonPath('data.imageUrl', null);
        Storage::disk('public')->assertMissing(substr($url2, strlen('/storage/')));

        // Wrong content is rejected even with an image name
        $this->post("/api/v1/admin/items/{$id}", array_merge($base, ['imageAction' => 'replace', 'image' => UploadedFile::fake()->createWithContent('x.jpg', 'not an image')]))
            ->assertStatus(422)->assertJsonValidationErrors('image');
        $this->post("/api/v1/admin/items/{$id}", array_merge($base, ['imageAction' => 'replace', 'image' => UploadedFile::fake()->create('big.jpg', 10241, 'image/jpeg')]))
            ->assertStatus(422)->assertJsonValidationErrors('image');
    }

    // ---------------- Roles ----------------

    public function test_editor_cannot_use_owner_areas(): void
    {
        $this->actingAs($this->editor());
        $cat = Category::first();
        $this->getJson('/api/v1/admin/categories')->assertForbidden();
        $this->postJson('/api/v1/admin/categories', ['name' => 'X'])->assertForbidden();
        $this->patchJson("/api/v1/admin/categories/{$cat->id}", ['isVisible' => false])->assertForbidden();
        $this->deleteJson("/api/v1/admin/categories/{$cat->id}")->assertForbidden();
        $this->getJson('/api/v1/admin/settings')->assertForbidden();
        $this->postJson('/api/v1/admin/settings/branding', [])->assertForbidden();
        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->postJson('/api/v1/admin/users', ['name' => 'a', 'email' => 'a@b.c', 'role' => 'owner'])->assertForbidden();
    }

    // ---------------- Categories ----------------

    public function test_owner_manages_categories_and_public_menu_follows(): void
    {
        $this->actingAs($this->owner());

        $new = $this->postJson('/api/v1/admin/categories', ['name' => '  Breakfast  '])->assertCreated()
            ->assertJsonPath('data.name', 'Breakfast')->assertJsonPath('data.displayOrder', 10)->json('data');
        $this->postJson('/api/v1/admin/categories', ['name' => 'breakfast'])->assertStatus(409)->assertJsonPath('code', 'duplicate');
        $this->assertSame('Breakfast', last($this->getJson('/api/v1/menu')->json('data.categories'))['name']);

        $this->patchJson("/api/v1/admin/categories/{$new['id']}", ['name' => 'Morning'])->assertOk()->assertJsonPath('data.slug', 'breakfast');

        $smoothies = Category::where('slug', 'smoothies')->first();
        $this->patchJson("/api/v1/admin/categories/{$smoothies->id}", ['isVisible' => false])->assertOk();
        $this->assertNotContains('Smoothies', array_column($this->getJson('/api/v1/menu')->json('data.categories'), 'name'));

        $ids = Category::orderBy('display_order')->pluck('id')->all();
        $reordered = [$ids[1], $ids[0], ...array_slice($ids, 2)];
        $this->patchJson('/api/v1/admin/categories/order', ['ids' => $reordered])->assertOk();
        $this->patchJson("/api/v1/admin/categories/{$smoothies->id}", ['isVisible' => true])->assertOk();
        $this->assertSame(['Hot Drinks', 'Smoothies'], array_slice(array_column($this->getJson('/api/v1/menu')->json('data.categories'), 'name'), 0, 2));
        $this->patchJson('/api/v1/admin/categories/order', ['ids' => [$ids[0]]])->assertStatus(422);

        $this->deleteJson("/api/v1/admin/categories/{$smoothies->id}")->assertStatus(409)->assertJsonPath('code', 'not_empty');
        $this->deleteJson("/api/v1/admin/categories/{$new['id']}")->assertNoContent();
        $this->assertSame(range(1, 9), Category::orderBy('display_order')->pluck('display_order')->all());
    }

    // ---------------- Branding ----------------

    public function test_branding_validates_contrast_and_updates_public_settings(): void
    {
        $this->actingAs($this->owner());
        $this->getJson('/api/v1/settings/public')->assertOk()->assertJsonPath('data.primaryColor', '#32000C')->assertJsonPath('data.logoUrl', null);

        $this->post('/api/v1/admin/settings/branding', ['primaryColor' => '#FFFF00', 'secondaryColor' => '#3F6A2E', 'logoAction' => 'keep'])
            ->assertStatus(422)->assertJsonValidationErrors('primaryColor');
        $this->post('/api/v1/admin/settings/branding', ['primaryColor' => 'red', 'secondaryColor' => '#3F6A2E', 'logoAction' => 'keep'])
            ->assertStatus(422);

        $this->post('/api/v1/admin/settings/branding', [
            'primaryColor' => '#1a1a40', 'secondaryColor' => '#2E5A1E', 'logoAction' => 'replace',
            'logo' => UploadedFile::fake()->image('logo.png', 1000, 1000),
        ])->assertOk();
        $pub = $this->getJson('/api/v1/settings/public')->json('data');
        $this->assertSame(['#1A1A40', '#2E5A1E'], [$pub['primaryColor'], $pub['secondaryColor']]);
        $this->assertStringStartsWith('/storage/media/', $pub['logoUrl']);

        $this->post('/api/v1/admin/settings/branding', ['primaryColor' => '#32000C', 'secondaryColor' => '#3F6A2E', 'logoAction' => 'remove'])->assertOk();
        $this->assertNull($this->getJson('/api/v1/settings/public')->json('data.logoUrl'));
    }

    // ---------------- Users ----------------

    public function test_owner_manages_users_with_last_owner_protection(): void
    {
        Notification::fake();
        $owner = $this->owner();
        $this->actingAs($owner);

        $ed = $this->postJson('/api/v1/admin/users', ['name' => 'Sara', 'email' => 'Sara@Example.com', 'role' => 'editor'])
            ->assertCreated()->assertJsonPath('data.email', 'sara@example.com')->json('data');
        Notification::assertSentTo(User::find($ed['id']), AccountSetup::class);
        $this->postJson('/api/v1/admin/users', ['name' => 'Dup', 'email' => 'sara@example.com', 'role' => 'editor'])->assertStatus(422);

        // The only Owner can't be demoted, disabled or deleted
        $this->patchJson("/api/v1/admin/users/{$owner->id}", ['role' => 'editor'])->assertStatus(409)->assertJsonPath('code', 'last_owner');
        $this->patchJson("/api/v1/admin/users/{$owner->id}/status", ['isActive' => false])->assertStatus(409);
        $this->deleteJson("/api/v1/admin/users/{$owner->id}")->assertStatus(409);

        // Promote Sara → now there are two Owners; the first can step down
        $this->patchJson("/api/v1/admin/users/{$ed['id']}", ['role' => 'owner'])->assertOk();
        $this->patchJson("/api/v1/admin/users/{$owner->id}", ['role' => 'editor'])->assertOk();
        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->actingAs($owner->fresh())->getJson('/api/v1/admin/users')->assertForbidden();

        // Sara (owner) disables and deletes the other account
        $sara = User::find($ed['id']);
        $this->flushSession();
        $this->actingAs($sara)->patchJson("/api/v1/admin/users/{$owner->id}/status", ['isActive' => false])->assertOk()->assertJsonPath('data.isActive', false);
        $this->patchJson("/api/v1/admin/users/{$sara->id}/status", ['isActive' => false])->assertStatus(409)->assertJsonPath('code', 'self');
        $this->postJson("/api/v1/admin/users/{$owner->id}/password-link")->assertStatus(409);
        $this->patchJson("/api/v1/admin/users/{$owner->id}/status", ['isActive' => true])->assertOk();
        $this->postJson("/api/v1/admin/users/{$owner->id}/password-link")->assertOk();
        $this->postJson("/api/v1/admin/users/{$owner->id}/password-link")->assertStatus(429)->assertJsonPath('code', 'throttled');
        $this->deleteJson("/api/v1/admin/users/{$owner->id}")->assertNoContent();
        $this->assertSame(1, User::count());
    }

    // ---------------- Stock photos ----------------

    public function test_photo_seeder_adds_photos_to_prepared_items_only_and_keeps_owner_photos(): void
    {
        $this->actingAs($this->editor());
        $mango = MenuItem::where('slug', 'mango-smoothie')->first();
        $ownerUrl = $this->post("/api/v1/admin/items/{$mango->id}", $this->itemPayload([
            '_method' => 'PATCH', 'name' => 'Mango Smoothie', 'description' => $mango->description, 'price' => '5', 'displayOrder' => '2',
            'imageAction' => 'replace', 'image' => UploadedFile::fake()->image('own.jpg', 800, 600),
        ]))->assertOk()->json('data.imageUrl');

        $jpeg = UploadedFile::fake()->image('stock.jpg', 1200, 900)->getContent();
        \Illuminate\Support\Facades\Http::fake(['images.unsplash.com/*' => \Illuminate\Support\Facades\Http::response($jpeg, 200, ['Content-Type' => 'image/jpeg'])]);
        $this->seed(\Database\Seeders\PhotoSeeder::class);

        $this->assertSame($ownerUrl, $mango->fresh()->image?->url(), 'owner photo kept');
        $this->assertNotNull(MenuItem::where('slug', 'tea')->first()->image_id);
        $this->assertSame(MenuItem::where('slug', 'tea-pot')->value('image_id'), MenuItem::where('slug', 'tea-pot-2')->value('image_id'), 'same picture stored once');
        foreach (['cola', 'freeze', 'dark-blue', 'boom-boom', 'extra-juice', 'delster', 'sparkling-water', 'chips', 'pringles', 'mars', 'snickers', 'twix'] as $branded) {
            $this->assertNull(MenuItem::where('slug', $branded)->value('image_id'), "{$branded} keeps its placeholder");
        }
        [$w, $h] = getimagesizefromstring(Storage::disk('public')->get(MenuItem::where('slug', 'tea')->first()->image->path));
        $this->assertSame([900, 675], [$w, $h]);
        $this->assertNotNull(collect($this->publicItems())->firstWhere('slug', 'tea')['imageUrl']);
    }
}
