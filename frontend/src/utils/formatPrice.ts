import type { PriceString } from '@/types/menu';

/**
 * Formats a fixed-decimal price string in the menu PDF's style:
 * "1.50" → "$1.5", "1.75" → "$1.75", "5.00" → "$5", "0.50" → "$0.5".
 * Works on the string directly, so no floating-point rounding can occur.
 */
export function formatPrice(price: PriceString): string {
  const [whole, fraction = ''] = price.trim().split('.');
  const trimmedFraction = fraction.replace(/0+$/, '');
  return trimmedFraction ? `$${whole}.${trimmedFraction}` : `$${whole}`;
}
