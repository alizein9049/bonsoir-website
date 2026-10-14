import { ApiError, api } from '@/services/apiClient';
import type { AdminCategory } from '@/services/adminMenuService';

/**
 * Owner-only category management — Laravel API, saved in MySQL.
 *   GET    /api/v1/admin/categories
 *   POST   /api/v1/admin/categories
 *   PATCH  /api/v1/admin/categories/{id}        (name, visibility — slug is kept)
 *   PATCH  /api/v1/admin/categories/order       ({ ids: [...] })
 *   DELETE /api/v1/admin/categories/{id}        (409 if it still has items)
 */

export class CategoryError extends Error {
  constructor(
    public readonly kind: 'duplicate' | 'not_empty' | 'not_found' | 'invalid',
    message: string,
  ) {
    super(message);
    this.name = 'CategoryError';
  }
}

export const CATEGORY_NAME_MAX = 40;

/** Turns server answers into the friendly errors the Categories page already shows. */
async function wrap<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.status === 409) throw new CategoryError(e.code === 'not_empty' ? 'not_empty' : 'duplicate', e.message);
    if (e.status === 404) throw new CategoryError('not_found', 'This category no longer exists.');
    if (e.status === 422) throw new CategoryError('invalid', e.message);
    throw e;
  }
}

export function fetchCategories(): Promise<AdminCategory[]> {
  return api<AdminCategory[]>('GET', '/admin/categories');
}

export function createCategory(name: string): Promise<AdminCategory> {
  return wrap(() => api<AdminCategory>('POST', '/admin/categories', { name }));
}

export function renameCategory(id: number, name: string): Promise<AdminCategory> {
  return wrap(() => api<AdminCategory>('PATCH', `/admin/categories/${id}`, { name }));
}

export async function setCategoryVisible(id: number, isVisible: boolean): Promise<void> {
  await wrap(() => api<AdminCategory>('PATCH', `/admin/categories/${id}`, { isVisible }));
}

/** Moves a category one place up (-1) or down (+1) in the menu order. */
export async function moveCategory(id: number, direction: -1 | 1): Promise<void> {
  const list = await fetchCategories(); // latest saved order
  const from = list.findIndex((c) => c.id === id);
  if (from === -1) throw new CategoryError('not_found', 'This category no longer exists.');
  const to = from + direction;
  if (to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
  await wrap(() => api<AdminCategory[]>('PATCH', '/admin/categories/order', { ids: list.map((c) => c.id) }));
}

export function deleteCategory(id: number): Promise<void> {
  return wrap(() => api<void>('DELETE', `/admin/categories/${id}`));
}
