import { mockMenu } from '@/mocks/menuData';
import type { MenuCategory } from '@/types/menu';

/** A category as stored (the public menu only ever sees the visible ones). */
export interface StoreCategory extends MenuCategory {
  isVisible: boolean;
}

/**
 * TEMPORARY in-browser "database" shared by the public menu and the admin dashboard,
 * so changes made in the dashboard show on the customer menu during development.
 * It resets to the approved PDF data on every page reload.
 * Replaced by the Laravel API + MySQL.
 */
export const menuStore: { categories: StoreCategory[] } = {
  categories: structuredClone(mockMenu.categories).map((c) => ({ ...c, isVisible: true })),
};
