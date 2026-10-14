import { useCallback, useEffect, useState } from 'react';
import { fetchPublicMenu } from '@/services/menuService';
import type { PublicMenu } from '@/types/menu';

export type MenuState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; menu: PublicMenu };

/** Loads the public menu and exposes loading / error / ready states plus a retry. */
export function useMenu(): MenuState & { retry: () => void } {
  const [state, setState] = useState<MenuState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchPublicMenu()
      .then((menu) => {
        if (!cancelled) setState({ status: 'ready', menu });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error', message: 'We couldn’t load the menu. Please check your connection and try again.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
