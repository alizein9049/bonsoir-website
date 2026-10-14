<?php

namespace App\Support;

/**
 * WCAG 2.1 colour contrast helpers (used to reject unreadable brand colours).
 */
class Contrast
{
    public const MIN_TEXT = 4.5; // AA for normal text

    public static function ratio(string $hexA, string $hexB): float
    {
        $a = static::luminance($hexA);
        $b = static::luminance($hexB);

        return (max($a, $b) + 0.05) / (min($a, $b) + 0.05);
    }

    public static function luminance(string $hex): float
    {
        $hex = ltrim($hex, '#');
        $channels = array_map(
            fn (string $c) => hexdec($c) / 255,
            str_split($hex, 2),
        );
        [$r, $g, $b] = array_map(
            fn (float $c) => $c <= 0.03928 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4,
            $channels,
        );

        return 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    }
}
