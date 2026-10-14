import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import CategoryTabs from '@/components/menu/CategoryTabs';
import FeaturedRow from '@/components/menu/FeaturedRow';
import MenuFooter from '@/components/menu/MenuFooter';
import MenuHeader from '@/components/menu/MenuHeader';
import MenuHero from '@/components/menu/MenuHero';
import ProductCard from '@/components/menu/ProductCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMenu } from '@/hooks/useMenu';
import type { PublicMenu } from '@/types/menu';
import './MenuPage.css';

/**
 * Customer Main Menu.
 * Header → hero → featured (if any) → sticky category tabs → products of ONE category → footer.
 * Switching categories replaces the products in place (no new page, no history entries).
 */
export default function MenuPage() {
  useDocumentTitle('Menu');
  const menu = useMenu();

  return (
    <div className="bn-menu-page">
      <MenuHeader />
      <MenuHero />
      <main id="menu" className="bn-menu-main">
        {menu.status === 'loading' && (
          <div className="container bn-menu-state" role="status">
            <div className="spinner-border" aria-hidden="true" />
            <p className="mb-0">Loading menu…</p>
          </div>
        )}
        {menu.status === 'error' && (
          <div className="container bn-menu-state" role="alert">
            <p>{menu.message}</p>
            <button type="button" className="btn btn-primary bn-btn-touch" onClick={menu.retry}>
              Try again
            </button>
          </div>
        )}
        {menu.status === 'ready' && <MenuContent menu={menu.menu} />}
      </main>
      <MenuFooter />
    </div>
  );
}

function MenuContent({ menu }: { menu: PublicMenu }) {
  const { categories } = menu;
  const [activeId, setActiveId] = useState<number | null>(categories[0]?.id ?? null);
  const tabsAnchorRef = useRef<HTMLDivElement>(null);

  const featured = useMemo(
    () =>
      categories.flatMap((c) =>
        c.items.filter((i) => i.isFeatured).map((item) => ({ item, categorySlug: c.slug })),
      ),
    [categories],
  );

  const active = categories.find((c) => c.id === activeId) ?? null;

  // Set when the visitor switches category while scrolled into the list.
  const scrollToListRef = useRef(false);

  function selectCategory(id: number) {
    if (id === activeId) return;
    const anchor = tabsAnchorRef.current;
    scrollToListRef.current = !!anchor && window.scrollY > anchor.getBoundingClientRect().top + window.scrollY;
    setActiveId(id);
  }

  // After the new category has rendered, bring its first item into view just under the
  // sticky bar. Done after the update so the page height change can't cancel the scroll.
  useLayoutEffect(() => {
    if (!scrollToListRef.current) return;
    scrollToListRef.current = false;
    const anchor = tabsAnchorRef.current;
    if (!anchor) return;
    const top = anchor.getBoundingClientRect().top + window.scrollY;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }, [activeId]);

  if (categories.length === 0 || !active) {
    return (
      <div className="container bn-menu-state">
        <p className="mb-0">The menu is being updated. Please check back shortly.</p>
      </div>
    );
  }

  return (
    <>
      <FeaturedRow items={featured} />
      <div ref={tabsAnchorRef} />
      <CategoryTabs
        categories={categories.map(({ id, name }) => ({ id, name }))}
        activeId={active.id}
        onSelect={selectCategory}
        idPrefix="menu-cat"
      />
      <section
        id="menu-cat-panel"
        role="tabpanel"
        aria-labelledby={`menu-cat-tab-${active.id}`}
        className="container bn-menu-panel"
        tabIndex={0}
      >
        <div key={active.id} className="bn-menu-panel__content">
          <h2 className="bn-section-title">
            {active.name}
            <span className="bn-section-count">
              {active.items.length} {active.items.length === 1 ? 'item' : 'items'}
            </span>
          </h2>
          {active.items.length === 0 ? (
            <p className="bn-menu-empty">No items in this category yet.</p>
          ) : (
            <ul className="bn-grid" role="list">
              {active.items.map((item) => (
                <li key={item.id}>
                  <ProductCard item={item} categorySlug={active.slug} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
