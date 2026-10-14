import type { ReactElement } from 'react';
import './ProductPlaceholder.css';

/**
 * Brand-coloured placeholder shown until the owner uploads a real photo.
 * One simple line icon per category (approved). Purely decorative.
 */
type IconName = 'cup' | 'glass' | 'bottle' | 'milkshake' | 'snack' | 'dessert' | 'flatbread' | 'shisha';

const CATEGORY_ICON: Record<string, IconName> = {
  'smoothies': 'glass',
  'hot-drinks': 'cup',
  'cold-drinks': 'glass',
  'beverages': 'bottle',
  'milkshakes': 'milkshake',
  'chips-treats': 'snack',
  'dessert': 'dessert',
  'sajj': 'flatbread',
  'shisha': 'shisha',
};

const ICONS: Record<IconName, ReactElement> = {
  cup: (
    <>
      <path d="M14 26h28v14a10 10 0 0 1-10 10h-8a10 10 0 0 1-10-10V26Z" />
      <path d="M42 30h3a5 5 0 0 1 0 10h-3" />
      <path d="M22 13c0 3 3 3 3 6M30 11c0 3 3 3 3 6" />
      <path d="M10 54h36" />
    </>
  ),
  glass: (
    <>
      <path d="M16 18h28l-3.5 36h-21L16 18Z" />
      <path d="M17.5 30h25" />
      <path d="M33 18l6-10h6" />
      <circle cx="26" cy="40" r="2" />
      <circle cx="33" cy="45" r="1.5" />
    </>
  ),
  bottle: (
    <>
      <path d="M26 6h8v8l4 6v32a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V20l4-6V6Z" />
      <path d="M22 30h16v12H22z" />
    </>
  ),
  milkshake: (
    <>
      <path d="M17 24h26l-4 32H21l-4-32Z" />
      <path d="M17 24c0-5 4-8 8-8 1-4 4-6 5-6s4 2 5 6c4 0 8 3 8 8" />
      <path d="M34 16l5-10" />
      <path d="M19 34h22" />
    </>
  ),
  snack: (
    <>
      <path d="M18 8h24l-2 6 2 6v28l-2 6 2 2H18l2-2-2-6V20l2-6-2-6Z" />
      <path d="M24 30c3-4 9-4 12 0-3 4-9 4-12 0Z" />
    </>
  ),
  dessert: (
    <>
      <path d="M10 46h40v6H10z" />
      <path d="M12 46V32l34-12v26" />
      <path d="M12 38l34-10" />
      <path d="M38 22c0-4 2-7 5-8 1 3 0 6-2 8" />
    </>
  ),
  flatbread: (
    <>
      <path d="M8 34c6-14 38-14 44 0-6 14-38 14-44 0Z" />
      <path d="M18 30l4 2M28 27l2 3M38 30l4-1M22 39l3-2M34 39l2-3" />
    </>
  ),
  shisha: (
    <>
      <path d="M24 8h12l-2 6h-8l-2-6Z" />
      <path d="M30 14v12" />
      <path d="M22 26h16" />
      <path d="M27 26v6c-6 3-9 8-9 13a12 12 0 0 0 24 0c0-5-3-10-9-13v-6" />
      <path d="M40 40c6 0 10-4 12-10" />
    </>
  ),
};

export interface ProductPlaceholderProps {
  categorySlug: string;
  className?: string;
}

export default function ProductPlaceholder({ categorySlug, className = '' }: ProductPlaceholderProps) {
  const icon = CATEGORY_ICON[categorySlug] ?? 'cup';
  return (
    <div className={`bn-placeholder ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        {ICONS[icon]}
      </svg>
    </div>
  );
}
