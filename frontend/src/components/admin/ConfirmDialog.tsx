import { useEffect, useId, useRef, type ReactNode } from 'react';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** label of the safe button (default "Cancel") */
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog built on the native <dialog> element:
 * focus is trapped inside, Esc cancels, and focus returns to the trigger on close.
 * Focus starts on Cancel so a stray Enter never deletes anything.
 */
export default function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = 'Cancel', busy, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const uid = useId(); // unique ids: several dialogs can exist on one page

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      d.showModal();
      cancelRef.current?.focus();
    } else if (!open && d.open) {
      d.close();
      // Return focus to the button that opened the dialog; if it no longer exists
      // (e.g. its row was deleted), move focus to the main content instead.
      const target = returnFocusRef.current;
      if (target && target.isConnected && target !== document.body) target.focus();
      else document.getElementById('admin-main')?.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="bn-dialog"
      aria-labelledby={`${uid}-title`}
      aria-describedby={`${uid}-body`}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={`${uid}-title`} className="bn-dialog__title">
        {title}
      </h2>
      <div id={`${uid}-body`} className="bn-dialog__body">
        {children}
      </div>
      <div className="bn-dialog__actions">
        <button ref={cancelRef} type="button" className="btn btn-outline-secondary bn-btn-44" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-danger bn-btn-44" onClick={onConfirm} disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
