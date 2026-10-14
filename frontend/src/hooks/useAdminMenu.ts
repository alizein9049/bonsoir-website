import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/adminMenuService';
import type { AdminCategory } from '@/services/adminMenuService';
import type { MenuItem } from '@/types/menu';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; categories: AdminCategory[]; items: MenuItem[] };

/** Loads admin menu data and exposes featured-toggle and delete actions. */
export function useAdminMenu() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // First load shows a spinner; later reloads refresh quietly so the list doesn't flash.
    setState((s) => (s.status === 'ready' ? s : { status: 'loading' }));
    api
      .fetchAdminMenu()
      .then((d) => !cancelled && setState({ status: 'ready', ...d }))
      .catch(() => !cancelled && setState({ status: 'error', message: 'We couldn’t load the menu items. Please try again.' }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const patchItem = useCallback((id: number, patch: Partial<MenuItem>) => {
    setState((s) => (s.status === 'ready' ? { ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : s));
  }, []);

  /** Optimistic: flips immediately, rolls back if the save fails. */
  const toggleFeatured = useCallback(
    async (item: MenuItem) => {
      const next = !item.isFeatured;
      patchItem(item.id, { isFeatured: next });
      try {
        await api.setItemFeatured(item.id, next);
      } catch (e) {
        patchItem(item.id, { isFeatured: item.isFeatured });
        throw e;
      }
    },
    [patchItem],
  );

  const removeItem = useCallback(async (item: MenuItem) => {
    await api.deleteItem(item.id);
    setState((s) =>
      s.status === 'ready'
        ? {
            ...s,
            items: s.items.filter((i) => i.id !== item.id),
            categories: s.categories.map((c) => (c.id === item.categoryId ? { ...c, itemCount: c.itemCount - 1 } : c)),
          }
        : s,
    );
  }, []);

  return { state, reload, toggleFeatured, removeItem };
}
