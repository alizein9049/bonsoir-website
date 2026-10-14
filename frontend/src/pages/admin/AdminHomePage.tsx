import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ProductImage from '@/components/menu/ProductImage';
import { useAdminMenu } from '@/hooks/useAdminMenu';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { MenuItem } from '@/types/menu';
import { formatPrice } from '@/utils/formatPrice';
import type { DashboardOutletContext } from './ItemFormDialog';
import './AdminHomePage.css';

/** Admin Dashboard — Menu management (Owner and Menu Editor). */
export default function AdminHomePage() {
  useDocumentTitle('Menu items');
  const { state, reload, toggleFeatured, removeItem } = useAdminMenu();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | 'all'>('all');
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const noticeTimer = useRef<number>();

  function announce(kind: 'success' | 'error', text: string) {
    window.clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = window.setTimeout(() => setNotice(null), 5000);
  }
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const categoryName = useMemo(() => {
    const map = new Map<number, string>();
    if (state.status === 'ready') state.categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [state]);

  const visible = useMemo(() => {
    if (state.status !== 'ready') return [];
    const q = query.trim().toLowerCase();
    return state.items.filter((i) => {
      if (categoryId !== 'all' && i.categoryId !== categoryId) return false;
      if (!q) return true;
      return [i.name, i.description ?? '', categoryName.get(i.categoryId) ?? ''].some((t) => t.toLowerCase().includes(q));
    });
  }, [state, query, categoryId, categoryName]);

  async function handleToggle(item: MenuItem) {
    try {
      await toggleFeatured(item);
      announce('success', item.isFeatured ? `“${item.name}” removed from Featured.` : `“${item.name}” added to Featured.`);
    } catch {
      announce('error', `Couldn’t update “${item.name}”. Please try again.`);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeItem(pendingDelete);
      announce('success', `“${pendingDelete.name}” deleted.`);
      setPendingDelete(null);
    } catch {
      announce('error', `Couldn’t delete “${pendingDelete.name}”. Please try again.`);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setQuery('');
    setCategoryId('all');
  }

  return (
    <>
      <div className="bn-page-head">
        <div>
          <h1 className="bn-page-title">Menu items</h1>
          <p className="bn-page-sub">Add, edit and feature the items on the Bonsoir menu.</p>
        </div>
        <Link to="items/new" className="btn btn-primary bn-btn-44 bn-add-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add item
        </Link>
      </div>

      {/* Polite live region for results of actions */}
      <div className="bn-notice-slot" role="status" aria-live="polite">
        {notice && <div className={`alert ${notice.kind === 'success' ? 'alert-success' : 'alert-danger'} bn-notice`}>{notice.text}</div>}
      </div>

      {state.status === 'loading' && (
        <div className="bn-admin-state" role="status">
          <div className="spinner-border" aria-hidden="true" />
          <span>Loading menu items…</span>
        </div>
      )}

      {state.status === 'error' && (
        <div className="bn-admin-state" role="alert">
          <p>{state.message}</p>
          <button type="button" className="btn btn-primary bn-btn-44" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <dl className="bn-stats">
            <div className="bn-stat">
              <dt>Items</dt>
              <dd>{state.items.length}</dd>
            </div>
            <div className="bn-stat">
              <dt>Categories</dt>
              <dd>{state.categories.length}</dd>
            </div>
            <div className="bn-stat">
              <dt>Featured</dt>
              <dd>{state.items.filter((i) => i.isFeatured).length}</dd>
            </div>
            <div className="bn-stat">
              <dt>Without photo</dt>
              <dd>{state.items.filter((i) => !i.imageUrl).length}</dd>
            </div>
          </dl>

          <div className="bn-toolbar" role="search">
            <div className="bn-toolbar__search">
              <label htmlFor="item-search" className="visually-hidden">
                Search items
              </label>
              <input
                id="item-search"
                type="search"
                className="form-control"
                placeholder="Search items…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="bn-toolbar__filter">
              <label htmlFor="category-filter" className="visually-hidden">
                Filter by category
              </label>
              <select
                id="category-filter"
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All categories</option>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.itemCount}){c.isVisible ? '' : ' – hidden'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="bn-result-count">
            Showing {visible.length} of {state.items.length} items
          </p>

          {visible.length === 0 ? (
            <div className="bn-admin-state">
              <p className="mb-2">{state.items.length === 0 ? 'There are no menu items yet.' : 'No items match your search.'}</p>
              {state.items.length > 0 && (
                <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={clearFilters}>
                  Clear search and filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Tablet & desktop: table */}
              <div className="bn-table-wrap d-none d-md-block">
                <table className="table align-middle mb-0 bn-table">
                  <caption className="visually-hidden">Menu items</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="bn-col-photo">
                        <span className="visually-hidden">Photo</span>
                      </th>
                      <th scope="col">Item</th>
                      <th scope="col">Category</th>
                      <th scope="col" className="text-end">Price</th>
                      <th scope="col" className="text-center">Featured</th>
                      <th scope="col" className="text-end">
                        <span className="visually-hidden">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <ItemThumb item={item} slug={slugFor(state.categories, item.categoryId)} />
                        </td>
                        <td>
                          <div className="bn-item-name">{item.name}</div>
                          <div className="bn-item-desc">{item.description ?? <em>Description pending</em>}</div>
                        </td>
                        <td className="text-nowrap">{categoryName.get(item.categoryId)}</td>
                        <td className="text-end fw-semibold">{formatPrice(item.price)}</td>
                        <td className="text-center">
                          <FeaturedSwitch item={item} onToggle={handleToggle} />
                        </td>
                        <td className="text-end text-nowrap">
                          <RowActions item={item} onDelete={setPendingDelete} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Phones: compact cards */}
              <ul className="bn-item-cards d-md-none" role="list">
                {visible.map((item) => (
                  <li key={item.id} className="bn-item-card">
                    <ItemThumb item={item} slug={slugFor(state.categories, item.categoryId)} />
                    <div className="bn-item-card__body">
                      <div className="d-flex justify-content-between gap-2">
                        <span className="bn-item-name">{item.name}</span>
                        <span className="fw-semibold text-nowrap">{formatPrice(item.price)}</span>
                      </div>
                      <div className="bn-item-desc">
                        {categoryName.get(item.categoryId)} · {item.description ?? <em>Description pending</em>}
                      </div>
                      <div className="bn-item-card__actions">
                        <FeaturedSwitch item={item} onToggle={handleToggle} showLabel />
                        <RowActions item={item} onDelete={setPendingDelete} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {/* Item Create/Edit form opens here, over the dashboard */}
      {state.status === 'ready' && (
        <Outlet context={{ categories: state.categories, reload, announce } satisfies DashboardOutletContext} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete “${pendingDelete?.name ?? ''}”?`}
        confirmLabel="Delete item"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        <p className="mb-0">
          {pendingDelete && (
            <>
              {pendingDelete.name} · {formatPrice(pendingDelete.price)}
              {pendingDelete.description ? ` · ${pendingDelete.description}` : ''}
              <br />
            </>
          )}
          It will be removed from the menu. This can’t be undone.
        </p>
      </ConfirmDialog>
    </>
  );
}

function slugFor(categories: { id: number; slug: string }[], id: number): string {
  return categories.find((c) => c.id === id)?.slug ?? '';
}

/** Identifies an item uniquely for screen readers (names can repeat, e.g. "Tea Pot"). */
function itemLabel(item: MenuItem): string {
  return `${item.name}, ${formatPrice(item.price)}`;
}

function ItemThumb({ item, slug }: { item: MenuItem; slug: string }) {
  return <ProductImage imageUrl={item.imageUrl} name={item.name} categorySlug={slug} className="bn-thumb" />;
}

function FeaturedSwitch({ item, onToggle, showLabel }: { item: MenuItem; onToggle: (i: MenuItem) => void; showLabel?: boolean }) {
  const id = `featured-${item.id}${showLabel ? '-m' : ''}`;
  return (
    <div className="form-check form-switch bn-switch">
      <input
        id={id}
        className="form-check-input"
        type="checkbox"
        role="switch"
        checked={item.isFeatured}
        onChange={() => onToggle(item)}
      />
      <label htmlFor={id} className={showLabel ? 'form-check-label' : 'visually-hidden'}>
        {showLabel ? 'Featured' : `Featured: ${itemLabel(item)}`}
        {showLabel && <span className="visually-hidden">: {itemLabel(item)}</span>}
      </label>
    </div>
  );
}

function RowActions({ item, onDelete }: { item: MenuItem; onDelete: (i: MenuItem) => void }) {
  return (
    <span className="bn-row-actions">
      <Link to={`items/${item.id}/edit`} className="btn btn-outline-secondary btn-sm bn-btn-44">
        Edit<span className="visually-hidden"> {itemLabel(item)}</span>
      </Link>
      <button type="button" className="btn btn-outline-danger btn-sm bn-btn-44" onClick={() => onDelete(item)}>
        Delete<span className="visually-hidden"> {itemLabel(item)}</span>
      </button>
    </span>
  );
}
