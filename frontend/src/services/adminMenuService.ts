import { ApiError, api } from '@/services/apiClient';
import type { ItemOptionType, MenuCategory, MenuItem } from '@/types/menu';

/**
 * Admin menu management (Owner + Menu Editor) — Laravel API, saved in MySQL.
 *   GET    /api/v1/admin/items            → { categories, items }
 *   GET    /api/v1/admin/items/{id}
 *   POST   /api/v1/admin/items            (multipart: fields + optional image)
 *   PATCH  /api/v1/admin/items/{id}       (multipart, sent as POST + _method)
 *   PATCH  /api/v1/admin/items/{id}/featured
 *   DELETE /api/v1/admin/items/{id}
 * Every change clears the public menu cache, so the customer menu shows it at once.
 */
export type AdminCategory = Omit<MenuCategory, 'items'> & { isVisible: boolean; itemCount: number };

export interface AdminMenuData {
  categories: AdminCategory[];
  items: MenuItem[];
}

/** What the photo field asks the server to do on save. */
export type ImageChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; file: File };

export interface ItemInput {
  categoryId: number;
  name: string;
  description: string | null;
  /** fixed-decimal string, e.g. "3.50" */
  price: string;
  isFeatured: boolean;
  /** 1-based position inside the category */
  displayOrder: number;
  options: { type: ItemOptionType; name: string }[];
  image: ImageChange;
}

function toFormData(input: ItemInput): FormData {
  const f = new FormData();
  f.set('categoryId', String(input.categoryId));
  f.set('name', input.name);
  f.set('description', input.description ?? '');
  f.set('price', input.price);
  f.set('isFeatured', input.isFeatured ? '1' : '0');
  f.set('displayOrder', String(input.displayOrder));
  f.set('options', JSON.stringify(input.options));
  f.set('imageAction', input.image.kind);
  if (input.image.kind === 'replace') f.set('image', input.image.file);
  return f;
}

export function fetchAdminMenu(): Promise<AdminMenuData> {
  return api<AdminMenuData>('GET', '/admin/items');
}

export async function fetchAdminItem(id: number): Promise<MenuItem | null> {
  try {
    return await api<MenuItem>('GET', `/admin/items/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function createItem(input: ItemInput): Promise<MenuItem> {
  return api<MenuItem>('POST', '/admin/items', toFormData(input));
}

export function updateItem(id: number, input: ItemInput): Promise<MenuItem> {
  return api<MenuItem>('PATCH', `/admin/items/${id}`, toFormData(input));
}

export async function setItemFeatured(id: number, isFeatured: boolean): Promise<void> {
  await api<MenuItem>('PATCH', `/admin/items/${id}/featured`, { isFeatured });
}

export function deleteItem(id: number): Promise<void> {
  return api<void>('DELETE', `/admin/items/${id}`);
}
