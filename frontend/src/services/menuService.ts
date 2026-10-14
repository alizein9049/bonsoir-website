import { api } from '@/services/apiClient';
import type { PublicMenu } from '@/types/menu';

/** Public menu from MySQL via Laravel: visible categories only, in display order. */
export function fetchPublicMenu(): Promise<PublicMenu> {
  return api<PublicMenu>('GET', '/menu');
}
