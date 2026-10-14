import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import NameDialog from '@/components/admin/NameDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import * as api from '@/services/adminCategoryService';
import { CATEGORY_NAME_MAX } from '@/services/adminCategoryService';
import type { AdminCategory } from '@/services/adminMenuService';
import './AdminCategoriesPage.css';

type NameMode = { kind: 'create' } | { kind: 'rename'; category: AdminCategory } | null;

/** Owner-only: create, rename, reorder, show/hide and delete (empty) categories. */
export default function AdminCategoriesPage() {
  useDocumentTitle('Categories');
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [nameMode, setNameMode] = useState<NameMode>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const noticeTimer = useRef<number>();
  const moveRefs = useRef(new Map<string, HTMLButtonElement>());

  const announce = useCallback((kind: 'success' | 'error', text: string) => {
    window.clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = window.setTimeout(() => setNotice(null), 6000);
  }, []);
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const load = useCallback(async () => {
    try {
      setCategories(await api.fetchCategories());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function handleMove(c: AdminCategory, direction: -1 | 1) {
    setBusyId(c.id);
    try {
      await api.moveCategory(c.id, direction);
      await load();
      const list = categories ?? [];
      const newIndex = list.findIndex((x) => x.id === c.id) + direction;
      announce('success', `“${c.name}” moved to position ${newIndex + 1} of ${list.length}.`);
      // Keep keyboard focus on the moved row; if that button is now disabled (top/bottom), use the other one.
      setTimeout(() => {
        const same = moveRefs.current.get(`${c.id}:${direction}`);
        const other = moveRefs.current.get(`${c.id}:${-direction}`);
        (same && !same.disabled ? same : other)?.focus();
      }, 0);
    } catch (e) {
      announce('error', e instanceof Error ? e.message : 'Couldn’t move the category.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleVisible(c: AdminCategory) {
    const next = !c.isVisible;
    setCategories((list) => list?.map((x) => (x.id === c.id ? { ...x, isVisible: next } : x)) ?? null);
    try {
      await api.setCategoryVisible(c.id, next);
      announce('success', next ? `“${c.name}” is now shown on the menu.` : `“${c.name}” is now hidden from the menu.`);
    } catch {
      setCategories((list) => list?.map((x) => (x.id === c.id ? { ...x, isVisible: c.isVisible } : x)) ?? null);
      announce('error', `Couldn’t update “${c.name}”. Please try again.`);
    }
  }

  function handleDeleteClick(c: AdminCategory) {
    if (c.itemCount > 0) {
      announce(
        'error',
        `“${c.name}” can’t be deleted because it still has ${c.itemCount} item${c.itemCount === 1 ? '' : 's'}. Move or delete them first (Menu items › Edit › Category).`,
      );
      return;
    }
    setPendingDelete(c);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteCategory(pendingDelete.id);
      await load();
      announce('success', `“${pendingDelete.name}” deleted.`);
    } catch (e) {
      announce('error', e instanceof Error ? e.message : 'Couldn’t delete the category.');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  async function submitName(value: string) {
    if (nameMode?.kind === 'create') {
      const created = await api.createCategory(value);
      await load();
      setNameMode(null);
      announce('success', `“${created.name}” added at the end of the menu. It’s empty until you add items to it.`);
    } else if (nameMode?.kind === 'rename') {
      const renamed = await api.renameCategory(nameMode.category.id, value);
      await load();
      setNameMode(null);
      announce('success', `Renamed to “${renamed.name}”.`);
    }
  }

  return (
    <>
      <div className="bn-page-head">
        <div>
          <h1 className="bn-page-title">Categories</h1>
          <p className="bn-page-sub">The order here is the order of the tabs on the customer menu.</p>
        </div>
        <button type="button" className="btn btn-primary bn-btn-44 bn-add-btn" onClick={() => setNameMode({ kind: 'create' })}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add category
        </button>
      </div>

      <div className="bn-notice-slot" role="status" aria-live="polite">
        {notice && <div className={`alert ${notice.kind === 'success' ? 'alert-success' : 'alert-warning'} bn-notice`}>{notice.text}</div>}
      </div>

      {loadError && (
        <div className="bn-admin-state" role="alert">
          <p>We couldn’t load the categories.</p>
          <button type="button" className="btn btn-primary bn-btn-44" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}
      {!categories && !loadError && (
        <div className="bn-admin-state" role="status">
          <div className="spinner-border" aria-hidden="true" />
          <span>Loading categories…</span>
        </div>
      )}

      {categories && (
        <ol className="bn-cat-list" aria-label="Categories in menu order">
          {categories.map((c, i) => (
            <li key={c.id} className={`bn-cat${c.isVisible ? '' : ' is-hidden'}`}>
              <span className="bn-cat__pos" aria-hidden="true">
                {i + 1}
              </span>

              <div className="bn-cat__info">
                <span className="bn-cat__name">{c.name}</span>
                <span className="bn-cat__meta">
                  {c.itemCount} item{c.itemCount === 1 ? '' : 's'}
                  {!c.isVisible && <span className="bn-hidden-pill">Hidden from menu</span>}
                </span>
              </div>

              <div className="form-check form-switch bn-switch bn-cat__visible">
                <input
                  id={`cat-visible-${c.id}`}
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={c.isVisible}
                  onChange={() => void handleVisible(c)}
                />
                <label htmlFor={`cat-visible-${c.id}`} className="form-check-label">
                  Visible<span className="visually-hidden">: {c.name}</span>
                </label>
              </div>

              <div className="bn-cat__actions">
                <button
                  ref={(el) => {
                    if (el) moveRefs.current.set(`${c.id}:-1`, el);
                    else moveRefs.current.delete(`${c.id}:-1`);
                  }}
                  type="button"
                  className="btn btn-outline-secondary bn-btn-44 bn-icon-btn"
                  onClick={() => void handleMove(c, -1)}
                  disabled={i === 0 || busyId !== null}
                  aria-label={`Move ${c.name} up`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M12 19V5M6 11l6-6 6 6" />
                  </svg>
                </button>
                <button
                  ref={(el) => {
                    if (el) moveRefs.current.set(`${c.id}:1`, el);
                    else moveRefs.current.delete(`${c.id}:1`);
                  }}
                  type="button"
                  className="btn btn-outline-secondary bn-btn-44 bn-icon-btn"
                  onClick={() => void handleMove(c, 1)}
                  disabled={i === categories.length - 1 || busyId !== null}
                  aria-label={`Move ${c.name} down`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M12 5v14M6 13l6 6 6-6" />
                  </svg>
                </button>
                <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={() => setNameMode({ kind: 'rename', category: c })}>
                  Rename<span className="visually-hidden"> {c.name}</span>
                </button>
                <button type="button" className="btn btn-outline-danger bn-btn-44" onClick={() => handleDeleteClick(c)}>
                  Delete<span className="visually-hidden"> {c.name}</span>
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <NameDialog
        open={nameMode !== null}
        title={nameMode?.kind === 'rename' ? `Rename “${nameMode.category.name}”` : 'Add category'}
        label="Category name"
        initialValue={nameMode?.kind === 'rename' ? nameMode.category.name : ''}
        submitLabel={nameMode?.kind === 'rename' ? 'Save name' : 'Add category'}
        maxLength={CATEGORY_NAME_MAX}
        onSubmit={submitName}
        onClose={() => setNameMode(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete “${pendingDelete?.name ?? ''}”?`}
        confirmLabel="Delete category"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      >
        <p className="mb-0">This empty category will be removed. This can’t be undone.</p>
      </ConfirmDialog>
    </>
  );
}
