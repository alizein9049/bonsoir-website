import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import './ConfirmDialog.css';

export interface NameDialogProps {
  open: boolean;
  title: string;
  label: string;
  initialValue?: string;
  submitLabel: string;
  maxLength: number;
  /** Resolve to close; reject with an Error whose message is shown under the field. */
  onSubmit: (value: string) => Promise<void>;
  onClose: () => void;
}

/** Small modal with one text field (create / rename). Esc or Cancel closes; focus returns to the trigger. */
export default function NameDialog({ open, title, label, initialValue = '', submitLabel, maxLength, onSubmit, onClose }: NameDialogProps) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setValue(initialValue);
      setError(null);
      d.showModal();
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    } else if (!open && d.open) {
      d.close();
      const t = returnFocusRef.current;
      if (t && t.isConnected && t !== document.body) t.focus();
      else document.getElementById('admin-main')?.focus();
    }
  }, [open, initialValue]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setTimeout(() => inputRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="bn-dialog"
      aria-labelledby={`${uid}-title`}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form onSubmit={handleSubmit} noValidate>
        <h2 id={`${uid}-title`} className="bn-dialog__title">
          {title}
        </h2>
        <label htmlFor={`${uid}-input`} className="form-label mt-2">
          {label}
        </label>
        <input
          ref={inputRef}
          id={`${uid}-input`}
          className={`form-control${error ? ' is-invalid' : ''}`}
          value={value}
          maxLength={maxLength}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-error` : undefined}
          disabled={busy}
          autoComplete="off"
        />
        {error && (
          <div id={`${uid}-error`} className="invalid-feedback">
            {error}
          </div>
        )}
        <div className="bn-dialog__actions">
          <button type="button" className="btn btn-outline-secondary bn-btn-44" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary bn-btn-44" disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
