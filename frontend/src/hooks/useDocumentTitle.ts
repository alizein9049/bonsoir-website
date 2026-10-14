import { useEffect } from 'react';

/**
 * Sets the browser tab title for the current page (and restores the previous
 * title when the page or dialog closes). Screen-reader users hear the new title.
 */
export function useDocumentTitle(pageTitle?: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = pageTitle ? `${pageTitle} · Bonsoir` : 'Bonsoir';
    return () => {
      document.title = previous;
    };
  }, [pageTitle]);
}
