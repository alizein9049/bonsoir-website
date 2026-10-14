import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { checkImageFile } from '@/components/admin/ImageUpload';
import officialLogo from '@/assets/brand/bonsoir-logo-720.webp';
import { useBranding } from '@/hooks/useBranding';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { applyBrandColors } from '@/app/BrandingProvider';
import { ApiError } from '@/services/apiClient';
import { fetchAdminSettings, saveBranding, type AdminSettings, type LogoChange } from '@/services/adminSettingsService';
import { HEX_PATTERN, contrastRatio } from '@/utils/color';
import './AdminBrandingPage.css';

type ColorField = 'primaryColor' | 'secondaryColor';

const FIELDS: { key: ColorField; label: string; help: string }[] = [
  { key: 'primaryColor', label: 'Main colour', help: 'Page background of the customer menu and Welcome Page.' },
  { key: 'secondaryColor', label: 'Button colour', help: 'Buttons, selected category tab and highlights.' },
];

/** Problem with a colour, or null. White text is used on both colours. */
function colorProblem(value: string): string | null {
  if (!HEX_PATTERN.test(value)) return 'Use a colour code like #32000C.';
  const ratio = contrastRatio(value, '#FFFFFF');
  if (ratio < 4.5) return `Too light: white text on it would be hard to read (contrast ${ratio.toFixed(1)}:1, needs 4.5:1). Choose a darker colour.`;
  return null;
}

/** Owner-only: logo and the two brand colours, applied to the whole website. */
export default function AdminBrandingPage() {
  useDocumentTitle('Branding');
  const uid = useId();
  const { refresh } = useBranding();
  const [saved, setSaved] = useState<AdminSettings | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [colors, setColors] = useState<Record<ColorField, string>>({ primaryColor: '', secondaryColor: '' });
  const [logo, setLogo] = useState<LogoChange>({ kind: 'keep' });
  const [logoError, setLogoError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ColorField, string>>>({});
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const s = await fetchAdminSettings();
      setSaved(s);
      setColors({ primaryColor: s.primaryColor, secondaryColor: s.secondaryColor });
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (logo.kind !== 'replace') {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logo.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  function setColor(key: ColorField, raw: string) {
    const value = raw.trim().toUpperCase();
    setColors((c) => ({ ...c, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = checkImageFile(file);
    setLogoError(problem);
    if (!problem) setLogo({ kind: 'replace', file });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const found: typeof errors = {};
    for (const f of FIELDS) {
      const p = colorProblem(colors[f.key]);
      if (p) found[f.key] = p;
    }
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`${uid}-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const s = await saveBranding({ ...colors, logo });
      setSaved(s);
      setLogo({ kind: 'keep' });
      applyBrandColors(s.primaryColor, s.secondaryColor);
      await refresh();
      setNotice({ kind: 'success', text: 'Branding saved. The customer menu now uses it.' });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        setErrors({ primaryColor: err.fieldErrors.primaryColor, secondaryColor: err.fieldErrors.secondaryColor });
        if (err.fieldErrors.logo) setLogoError(err.fieldErrors.logo);
      }
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Saving failed. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  function resetColors() {
    if (!saved) return;
    setColors({ primaryColor: saved.defaults.primaryColor, secondaryColor: saved.defaults.secondaryColor });
    setErrors({});
  }

  const currentLogo = logo.kind === 'replace' ? previewUrl : logo.kind === 'remove' ? null : saved?.logoUrl ?? null;
  const shownLogo = currentLogo ?? officialLogo;
  const usingOfficial = !currentLogo;
  const previewOk = !colorProblem(colors.primaryColor) && !colorProblem(colors.secondaryColor);

  return (
    <>
      <div className="bn-page-head">
        <div>
          <h1 className="bn-page-title">Branding</h1>
          <p className="bn-page-sub">Logo and colours of the customer menu.</p>
        </div>
      </div>

      <div className="bn-notice-slot" role="status" aria-live="polite">
        {notice && <div className={`alert ${notice.kind === 'success' ? 'alert-success' : 'alert-warning'} bn-notice`}>{notice.text}</div>}
      </div>

      {loadError && (
        <div className="bn-admin-state" role="alert">
          <p>We couldn’t load the branding.</p>
          <button type="button" className="btn btn-primary bn-btn-44" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}
      {!saved && !loadError && (
        <div className="bn-admin-state" role="status">
          <div className="spinner-border" aria-hidden="true" />
          <span>Loading branding…</span>
        </div>
      )}

      {saved && (
        <form className="bn-brand-form" onSubmit={handleSubmit} noValidate>
          <section className="bn-brand-card" aria-labelledby={`${uid}-logo-h`}>
            <h2 id={`${uid}-logo-h`} className="bn-brand-card__title">
              Logo
            </h2>
            <div className="bn-brand-logo">
              <span className="bn-logo bn-brand-logo__img">
                <img src={shownLogo} alt={usingOfficial ? 'Official Bonsoir logo' : 'New logo preview'} width={120} height={120} />
              </span>
              <div>
                <p className="bn-help mt-0 mb-2">
                  {usingOfficial ? 'The official Bonsoir logo is in use.' : 'Your uploaded logo.'} It is shown in a circle, so a square image works best.
                  JPEG, PNG or WebP, up to 10 MB.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" id={`${uid}-file`} onChange={handleFile} tabIndex={-1} aria-hidden="true" />
                  <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={() => fileRef.current?.click()} disabled={busy}>
                    {usingOfficial ? 'Upload a new logo' : 'Replace logo'}
                  </button>
                  {!usingOfficial && (
                    <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={() => setLogo(saved.logoUrl ? { kind: 'remove' } : { kind: 'keep' })} disabled={busy}>
                      Use official logo
                    </button>
                  )}
                </div>
                {logoError && (
                  <p className="bn-field-error" role="alert">
                    {logoError}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="bn-brand-card" aria-labelledby={`${uid}-col-h`}>
            <h2 id={`${uid}-col-h`} className="bn-brand-card__title">
              Colours
            </h2>
            {FIELDS.map((f) => {
              const id = `${uid}-${f.key}`;
              const valid = HEX_PATTERN.test(colors[f.key]);
              return (
                <div key={f.key} className="bn-color-row">
                  <label htmlFor={id} className="form-label">
                    {f.label}
                  </label>
                  <div className="bn-color-inputs">
                    <input
                      type="color"
                      className="bn-color-swatch"
                      value={valid ? colors[f.key].toLowerCase() : '#000000'}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      aria-label={`${f.label} picker`}
                      disabled={busy}
                    />
                    <input
                      id={id}
                      type="text"
                      className={`form-control bn-color-code${errors[f.key] ? ' is-invalid' : ''}`}
                      value={colors[f.key]}
                      onChange={(e) => setColor(f.key, e.target.value)}
                      maxLength={7}
                      spellCheck={false}
                      autoCapitalize="characters"
                      aria-invalid={errors[f.key] ? true : undefined}
                      aria-describedby={`${id}-help${errors[f.key] ? ` ${id}-err` : ''}`}
                      disabled={busy}
                    />
                  </div>
                  <p id={`${id}-help`} className="bn-help">
                    {f.help}
                  </p>
                  {errors[f.key] && (
                    <p id={`${id}-err`} className="bn-field-error">
                      {errors[f.key]}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="bn-brand-preview" aria-hidden="true" style={previewOk ? { background: colors.primaryColor } : undefined}>
              <span className="bn-brand-preview__text">Preview</span>
              <span className="bn-brand-preview__btn" style={previewOk ? { background: colors.secondaryColor } : undefined}>
                Enter Menu
              </span>
            </div>

            <button type="button" className="btn btn-link px-0 bn-btn-44" onClick={resetColors} disabled={busy}>
              Use the original Bonsoir colours
            </button>
          </section>

          <div className="bn-brand-actions">
            <button type="submit" className="btn btn-primary bn-btn-44 px-4" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Save branding'
              )}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
