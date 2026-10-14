<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Support\Contrast;
use App\Support\ImageStore;
use App\Support\MenuCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Owner-only branding: logo and the two brand colours. */
class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->present(SiteSetting::current()->load('logo'))]);
    }

    public function branding(Request $request): JsonResponse
    {
        $hex = 'regex:/^#[0-9A-Fa-f]{6}$/';
        $data = $request->validate([
            'primaryColor' => ['required', 'string', $hex],
            'secondaryColor' => ['required', 'string', $hex],
            'logoAction' => ['required', 'in:keep,remove,replace'],
            'logo' => ['required_if:logoAction,replace', 'nullable', 'file', 'max:10240'],
        ], [
            'primaryColor.regex' => 'Use a colour code like #32000C.',
            'secondaryColor.regex' => 'Use a colour code like #3F6A2E.',
            'logo.max' => 'The maximum logo size is 10 MB.',
            'logo.required_if' => 'Choose a logo file to upload.',
        ]);

        // White text sits on both colours (page background and buttons), in light and dark mode.
        $errors = [];
        foreach (['primaryColor' => 'background', 'secondaryColor' => 'button'] as $field => $role) {
            $ratio = Contrast::ratio($data[$field], '#FFFFFF');
            if ($ratio < Contrast::MIN_TEXT) {
                $errors[$field] = sprintf(
                    'This colour is too light: white text on the %s would be hard to read (contrast %.1f:1, needs at least 4.5:1). Choose a darker colour.',
                    $role, $ratio,
                );
            }
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        $settings = SiteSetting::current()->load('logo');
        $oldLogo = $settings->logo;
        $newLogo = $data['logoAction'] === 'replace'
            ? ImageStore::fromUpload($request->file('logo'), $request->user()->id, 'logo', 720)
            : null;

        $settings->primary_color = strtoupper($data['primaryColor']);
        $settings->secondary_color = strtoupper($data['secondaryColor']);
        $settings->updated_by = $request->user()->id;
        if ($data['logoAction'] === 'replace') {
            $settings->logo_media_id = $newLogo->id;
        } elseif ($data['logoAction'] === 'remove') {
            $settings->logo_media_id = null;
        }
        $settings->save();

        if ($data['logoAction'] !== 'keep') {
            ImageStore::deleteIfUnused($oldLogo);
        }
        MenuCache::clear();

        return response()->json(['data' => $this->present($settings->fresh('logo'))]);
    }

    private function present(SiteSetting $s): array
    {
        return $s->toPublicArray() + [
            'defaults' => [
                'primaryColor' => SiteSetting::DEFAULT_PRIMARY,
                'secondaryColor' => SiteSetting::DEFAULT_SECONDARY,
            ],
        ];
    }
}
