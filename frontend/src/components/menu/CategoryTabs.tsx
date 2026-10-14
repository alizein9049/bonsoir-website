import { useEffect, useRef, type KeyboardEvent } from 'react';
import './CategoryTabs.css';

export interface CategoryTab {
  id: number;
  name: string;
}

export interface CategoryTabsProps {
  categories: CategoryTab[];
  activeId: number;
  onSelect: (id: number) => void;
  /** id prefix shared with the tab panel for aria-controls / aria-labelledby */
  idPrefix: string;
}

/**
 * Horizontal, sticky category navigation (WAI-ARIA tabs pattern):
 * - one Tab stop; ← → Home End move between categories and select them
 * - swipe/scroll horizontally on phones; the active tab scrolls into view
 */
export default function CategoryTabs({ categories, activeId, onSelect, idPrefix }: CategoryTabsProps) {
  const tabRefs = useRef(new Map<number, HTMLButtonElement>());

  // Keep the selected tab visible inside the horizontal scroller.
  useEffect(() => {
    const el = tabRefs.current.get(activeId);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [activeId]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = categories.findIndex((c) => c.id === activeId);
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % categories.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + categories.length) % categories.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = categories.length - 1;
    else return;
    e.preventDefault();
    const target = categories[next];
    onSelect(target.id);
    tabRefs.current.get(target.id)?.focus();
  }

  return (
    <nav className="bn-tabs" aria-label="Menu categories">
      <div className="container bn-tabs__inner">
        <div className="bn-tabs__scroller" role="tablist" aria-label="Menu categories" onKeyDown={handleKeyDown}>
          {categories.map((c) => {
            const selected = c.id === activeId;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(c.id, el);
                  else tabRefs.current.delete(c.id);
                }}
                type="button"
                role="tab"
                id={`${idPrefix}-tab-${c.id}`}
                aria-selected={selected}
                aria-controls={`${idPrefix}-panel`}
                tabIndex={selected ? 0 : -1}
                className={`bn-tab${selected ? ' is-active' : ''}`}
                onClick={() => onSelect(c.id)}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
