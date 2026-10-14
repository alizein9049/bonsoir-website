/**
 * Public menu types. These mirror the planned Laravel response of
 * GET /api/v1/menu, so switching from local data to the API needs no UI change.
 */

/** Price as a fixed-decimal string from the API, e.g. "1.50" (never a float). */
export type PriceString = string;

export type ItemOptionType = 'flavor' | 'addon';

export interface ItemOption {
  id: number;
  type: ItemOptionType;
  name: string;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  /** null while a description is pending (never invented). */
  description: string | null;
  price: PriceString;
  /** null until the owner uploads a real photo → placeholder is shown. */
  imageUrl: string | null;
  isFeatured: boolean;
  displayOrder: number;
  /** Informational only (no prices). Empty at launch. */
  options: ItemOption[];
}

export interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface PublicMenu {
  /** Visible categories only, in display order, each with its items in display order. */
  categories: MenuCategory[];
}
