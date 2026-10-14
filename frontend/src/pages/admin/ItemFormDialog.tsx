import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ImageUpload from '@/components/admin/ImageUpload';
import OptionsEditor, { newOptionKey, type OptionDraft } from '@/components/admin/OptionsEditor';
import { ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import * as api from '@/services/adminMenuService';
import type { AdminCategory, ImageChange } from '@/services/adminMenuService';
import type { MenuItem } from '@/types/menu';
import { normalizePrice, PRICE_PATTERN, priceForInput } from '@/utils/price';
import './ItemFormDialog.css';

/** Shared by the dashboard to the form (via the router outlet). */
export interface DashboardOutletContext {
  categories: AdminCategory[];
  reload: () => void;
  announce: (kind: 'success' | 'error', text: string) => void;
}

interface Draft {
  name: string;
  categoryId: number | '';
  description: string;
  price: string;
  isFeatured: boolean;
  displayOrder: string;
  options: OptionDraft[];
  image: ImageChange;
}

type Errors = Partial<Record<'name' | 'categoryId' | 'description' | 'price' | 'displayOrder', string>> & {
  options?: Record<string, string>;
};

function toDraft(item: MenuItem): Draft {
  return {
    name: item.name,
    categoryId: item.categoryId,
    description: item.description ?? '',
    price: priceForInput(item.price),
    isFeatured: item.isFeatured,
    displayOrder: String(item.displayOrder),
    options: item.options.map((o) => ({ key: newOptionKey(), type: o.type, name: o.name })),
    image: { kind: 'keep' },
  };
}

/** Comparable snapshot (ignores generated keys) for the "unsaved changes" check. */
function snapshot(d: Draft): string {
  return JSON.stringify({ ...d, options: d.options.map(({ type, name }) => ({ type, name })), image: d.image.kind });
}

/**
 * Item Create / Edit — a dialog over the dashboard on desktop, a full-screen sheet on phones.
 * Routes: /admin/items/new and /admin/items/:id/edit
 */
export default function ItemFormDialog() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const itemId = isEdit ? Number(id) : null;
  useDocumentTitle(isEdit ? 'Edit item' : 'Add item');
  const navigate = useNavigate();
  const { categories, reload, announce } = useOutletContext<DashboardOutletContext>();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [loaded, setLoaded] = useState<MenuItem | null | 'loading' | 'missing'>(isEdit ? 'loading' : null);
  const [draft, setDraft] = useState<Draft>({
    name: '',
    categoryId: '',
    description: '',
    price: '',
    isFeatured: false,
    displayOrder: '',
    options: [],
    image: { kind: 'keep' },
  });
  const [initial, setInitial] = useState<string>(() => snapshot(draft));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Open as a modal and load the item when editing.
  useEffect(() => {
    dialogRef.current?.showModal();
    if (!isEdit) {
      nameRef.current?.focus();
      return;
    }
    let cancelled = false;
    api.fetchAdminItem(itemId!).then((item) => {
      if (cancelled) return;
      if (!item) return setLoaded('missing');
      const d = toDraft(item);
      setLoaded(item);
      setDraft(d);
      setInitial(snapshot(d));
      setTimeout(() => nameRef.current?.focus(), 0);
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, itemId]);

  const dirty = snapshot(draft) !== initial;

  // Warn before the browser tab is closed/reloaded with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const selectedCategory = categories.find((c) => c.id === draft.categoryId);
  const originalCategoryId = loaded && typeof loaded === 'object' ? loaded.categoryId : null;
  // Positions available in the chosen category (one extra slot if the item is joining it).
  const maxPosition = selectedCategory ? selectedCategory.itemCount + (originalCategoryId === selectedCategory.id ? 0 : 1) : 1;

  // When adding, or moving to another category, default the position to "last".
  const categoryIdForDefault = draft.categoryId;
  useEffect(() => {
    if (!selectedCategory) return;
    if (originalCategoryId === selectedCategory.id && loaded && typeof loaded === 'object') {
      setDraft((d) => ({ ...d, displayOrder: String(loaded.displayOrder) }));
    } else {
      setDraft((d) => ({ ...d, displayOrder: String(maxPosition) }));
    }
  }, [categoryIdForDefault]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  function close() {
    dialogRef.current?.close();
    navigate(ROUTES.adminHome, { replace: true });
    // Return focus to the Edit / Add button that opened the form, if it still exists.
    const back = returnFocusRef.current;
    setTimeout(() => {
      if (back instanceof HTMLElement && back.isConnected && back !== document.body) back.focus();
      else document.getElementById('admin-main')?.focus();
    }, 0);
  }

  function requestClose() {
    if (saving || deleting) return;
    if (dirty) setConfirmDiscard(true);
    else close();
  }

  function validate(d: Draft): Errors {
    const e: Errors = {};
    if (!d.name.trim()) e.name = 'Enter the item name.';
    else if (d.name.trim().length > 80) e.name = 'Keep the name under 80 characters.';
    if (d.categoryId === '') e.categoryId = 'Choose a category.';
    if (d.description.trim().length > 300) e.description = 'Keep the description under 300 characters.';
    const p = d.price.trim().replace(/^\$/, '');
    if (!p) e.price = 'Enter the price in USD.';
    else if (p.startsWith('-')) e.price = 'The price can’t be negative.';
    else if (!PRICE_PATTERN.test(p)) e.price = 'Enter a price like 3.5 or 5 (numbers only, up to 2 decimals).';
    const pos = Number(d.displayOrder);
    if (d.categoryId !== '' && (!Number.isInteger(pos) || pos < 1 || pos > maxPosition)) {
      e.displayOrder = `Enter a position from 1 to ${maxPosition}.`;
    }
    const opt: Record<string, string> = {};
    d.options.forEach((o) => {
      if (!o.name.trim()) opt[o.key] = 'Enter a name, or remove this option.';
    });
    if (Object.keys(opt).length) e.options = opt;
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setSaveError(null);
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length) {
      // Move focus to the first invalid field once the error state has rendered.
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    const input: api.ItemInput = {
      categoryId: Number(draft.categoryId),
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      price: normalizePrice(draft.price.trim().replace(/^\$/, '')),
      isFeatured: draft.isFeatured,
      displayOrder: Number(draft.displayOrder),
      options: draft.options.map((o) => ({ type: o.type, name: o.name.trim() })),
      image: draft.image,
    };
    setSaving(true);
    try {
      const saved = isEdit ? await api.updateItem(itemId!, input) : await api.createItem(input);
      reload();
      announce('success', isEdit ? `“${saved.name}” saved.` : `“${saved.name}” added to the menu.`);
      close();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Saving failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!itemId) return;
    setDeleting(true);
    try {
      await api.deleteItem(itemId);
      reload();
      announce('success', `“${draft.name}” deleted.`);
      setConfirmDelete(false);
      close();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
      setSaveError('Deleting failed. Please try again.');
    }
  }

  const busy = saving || deleting;
  const ready = !isEdit || (loaded !== null && typeof loaded === 'object');
  const title = isEdit ? 'Edit item' : 'Add item';
  const fieldIds = useMemo(() => ({ name: 'f-name', cat: 'f-category', desc: 'f-desc', price: 'f-price', order: 'f-order', feat: 'f-featured' }), []);

  return (
    <dialog
      ref={dialogRef}
      className="bn-sheet"
      aria-labelledby="item-form-title"
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
    >
      <form ref={formRef} className="bn-sheet__form" onSubmit={handleSubmit} noValidate>
        <header className="bn-sheet__head">
          <h2 id="item-form-title" className="bn-sheet__title">
            {title}
          </h2>
          <button type="button" className="bn-sheet__close" onClick={requestClose} aria-label="Close" disabled={busy}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="bn-sheet__body">
          {loaded === 'loading' && (
            <div className="bn-admin-state" role="status">
              <div className="spinner-border" aria-hidden="true" />
              <span>Loading item…</span>
            </div>
          )}
          {loaded === 'missing' && (
            <div className="bn-admin-state" role="alert">
              This item no longer exists. It may have been deleted.
            </div>
          )}

          {ready ? (
            <>
              {saveError && (
                <div className="alert alert-danger" role="alert">
                  {saveError}
                </div>
              )}
              {Object.keys(errors).length > 0 && (
                <div className="alert alert-danger bn-error-summary" role="alert">
                  Please fix the highlighted fields.
                </div>
              )}

              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor={fieldIds.name} className="form-label">Name</label>
                  <input
                    ref={nameRef}
                    id={fieldIds.name}
                    className={`form-control${errors.name ? ' is-invalid' : ''}`}
                    value={draft.name}
                    maxLength={80}
                    onChange={(e) => set('name', e.target.value)}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? `${fieldIds.name}-err` : undefined}
                    disabled={busy}
                    required
                  />
                  {errors.name && <div id={`${fieldIds.name}-err`} className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-12 col-sm-6">
                  <label htmlFor={fieldIds.cat} className="form-label">Category</label>
                  <select
                    id={fieldIds.cat}
                    className={`form-select${errors.categoryId ? ' is-invalid' : ''}`}
                    value={draft.categoryId}
                    onChange={(e) => set('categoryId', e.target.value === '' ? '' : Number(e.target.value))}
                    aria-invalid={errors.categoryId ? true : undefined}
                    aria-describedby={errors.categoryId ? `${fieldIds.cat}-err` : undefined}
                    disabled={busy}
                    required
                  >
                    <option value="">Choose a category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.isVisible ? '' : ' (hidden)'}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && <div id={`${fieldIds.cat}-err`} className="invalid-feedback">{errors.categoryId}</div>}
                </div>

                <div className="col-6 col-sm-3">
                  <label htmlFor={fieldIds.price} className="form-label">Price (USD)</label>
                  <div className={`input-group${errors.price ? ' has-validation' : ''}`}>
                    <span className="input-group-text" aria-hidden="true">$</span>
                    <input
                      id={fieldIds.price}
                      className={`form-control${errors.price ? ' is-invalid' : ''}`}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={draft.price}
                      onChange={(e) => set('price', e.target.value)}
                      aria-invalid={errors.price ? true : undefined}
                      aria-describedby={errors.price ? `${fieldIds.price}-err` : undefined}
                      disabled={busy}
                      required
                    />
                    {errors.price && <div id={`${fieldIds.price}-err`} className="invalid-feedback">{errors.price}</div>}
                  </div>
                </div>

                <div className="col-6 col-sm-3">
                  <label htmlFor={fieldIds.order} className="form-label">Position</label>
                  <input
                    id={fieldIds.order}
                    className={`form-control${errors.displayOrder ? ' is-invalid' : ''}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={maxPosition}
                    value={draft.displayOrder}
                    onChange={(e) => set('displayOrder', e.target.value)}
                    aria-invalid={errors.displayOrder ? true : undefined}
                    aria-describedby={`${fieldIds.order}-help${errors.displayOrder ? ` ${fieldIds.order}-err` : ''}`}
                    disabled={busy || !selectedCategory}
                  />
                  <div id={`${fieldIds.order}-help`} className="bn-help">
                    {selectedCategory ? `1–${maxPosition} in ${selectedCategory.name}` : 'Choose a category first'}
                  </div>
                  {errors.displayOrder && <div id={`${fieldIds.order}-err`} className="invalid-feedback d-block">{errors.displayOrder}</div>}
                </div>

                <div className="col-12">
                  <label htmlFor={fieldIds.desc} className="form-label">
                    Description <span className="bn-optional">(optional)</span>
                  </label>
                  <textarea
                    id={fieldIds.desc}
                    className={`form-control${errors.description ? ' is-invalid' : ''}`}
                    rows={3}
                    maxLength={300}
                    value={draft.description}
                    onChange={(e) => set('description', e.target.value)}
                    aria-invalid={errors.description ? true : undefined}
                    aria-describedby={`${fieldIds.desc}-count${errors.description ? ` ${fieldIds.desc}-err` : ''}`}
                    disabled={busy}
                  />
                  <div id={`${fieldIds.desc}-count`} className="bn-help">{draft.description.length}/300</div>
                  {errors.description && <div id={`${fieldIds.desc}-err`} className="invalid-feedback d-block">{errors.description}</div>}
                </div>

                <div className="col-12">
                  <div className="form-check form-switch bn-switch bn-switch--form">
                    <input
                      id={fieldIds.feat}
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={draft.isFeatured}
                      onChange={(e) => set('isFeatured', e.target.checked)}
                      disabled={busy}
                    />
                    <label htmlFor={fieldIds.feat} className="form-check-label">
                      Featured <span className="bn-optional">— show in the Featured row on the menu</span>
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <ImageUpload
                    currentUrl={loaded && typeof loaded === 'object' ? loaded.imageUrl : null}
                    value={draft.image}
                    onChange={(image) => set('image', image)}
                    categorySlug={selectedCategory?.slug ?? ''}
                    itemName={draft.name}
                    disabled={busy}
                  />
                </div>

                <div className="col-12">
                  <OptionsEditor value={draft.options} onChange={(o) => set('options', o)} errors={errors.options ?? {}} disabled={busy} />
                </div>
              </div>
            </>
          ) : null}
        </div>

        <footer className="bn-sheet__foot">
          {isEdit && typeof loaded === 'object' && loaded !== null && (
            <button type="button" className="btn btn-outline-danger bn-btn-44 me-auto" onClick={() => setConfirmDelete(true)} disabled={busy}>
              Delete
            </button>
          )}
          <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={requestClose} disabled={busy}>
            Cancel
          </button>
          {loaded !== 'missing' && loaded !== 'loading' && (
            <button type="submit" className="btn btn-primary bn-btn-44 bn-save" disabled={busy}>
              {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add item'}
            </button>
          )}
        </footer>
      </form>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard changes?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmDiscard(false);
          close();
        }}
        onCancel={() => setConfirmDiscard(false)}
      >
        <p className="mb-0">You have unsaved changes to this item. If you leave now, they will be lost.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${draft.name}”?`}
        confirmLabel="Delete item"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      >
        <p className="mb-0">It will be removed from the menu. This can’t be undone.</p>
      </ConfirmDialog>
    </dialog>
  );
}
