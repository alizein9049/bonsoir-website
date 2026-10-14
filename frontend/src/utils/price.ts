/** Validates a price typed by an admin: 0–9999.99, at most 2 decimals, no negatives. */
export const PRICE_PATTERN = /^\d{1,4}(\.\d{1,2})?$/;

/** "3.5" → "3.50", "5" → "5.00" (the fixed-decimal form the API stores). */
export function normalizePrice(input: string): string {
  const [whole, fraction = ''] = input.trim().split('.');
  return `${Number(whole)}.${(fraction + '00').slice(0, 2)}`;
}

/** "3.50" → "3.5", "5.00" → "5" (how prices are typed and shown, PDF style). */
export function priceForInput(price: string): string {
  const [whole, fraction = ''] = price.split('.');
  const f = fraction.replace(/0+$/, '');
  return f ? `${whole}.${f}` : whole;
}
