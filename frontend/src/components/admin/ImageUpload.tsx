import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import ProductPlaceholder from '@/components/menu/ProductPlaceholder';
import type { ImageChange } from '@/services/adminMenuService';
import './ImageUpload.css';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB (approved)
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = /\.(jpe?g|png|webp)$/i;

/** Returns an error message, or null if the file is acceptable. (The server re-checks the real file content.) */
export function checkImageFile(file: File): string | null {
  if (/\.(heic|heif)$/i.test(file.name) || /heic|heif/i.test(file.type)) {
    return 'HEIC photos (iPhone format) aren’t supported. Please use JPEG, PNG or WebP — on iPhone, set Camera › Formats to “Most Compatible”, or export the photo as JPEG.';
  }
  if (!ACCEPTED_TYPES.includes(file.type) || !ACCEPTED_EXT.test(file.name)) {
    return 'This file type isn’t supported. Please choose a JPEG, PNG or WebP image.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `This photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is 10 MB.`;
  }
  return null;
}

export interface ImageUploadProps {
  /** photo currently saved on the item (null = none) */
  currentUrl: string | null;
  value: ImageChange;
  onChange: (change: ImageChange) => void;
  categorySlug: string;
  itemName: string;
  disabled?: boolean;
}

/**
 * Product photo field: choose → preview → replace or remove. Optional.
 * The preview uses the same 4:3 crop as the menu cards.
 */
export default function ImageUpload({ currentUrl, value, onChange, categorySlug, itemName, disabled }: ImageUploadProps) {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Temporary preview link for a newly chosen file (released when no longer needed).
  useEffect(() => {
    if (value.kind !== 'replace') {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const shownUrl = value.kind === 'replace' ? previewUrl : value.kind === 'remove' ? null : currentUrl;
  const hasPhoto = Boolean(shownUrl);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    const problem = checkImageFile(file);
    setError(problem);
    if (!problem) onChange({ kind: 'replace', file });
  }

  return (
    <fieldset className="bn-upload" aria-describedby={error ? `${helpId} ${errorId}` : helpId}>
      <legend className="form-label">Photo <span className="bn-optional">(optional)</span></legend>

      <div className="bn-upload__frame">
        {hasPhoto ? (
          <img src={shownUrl ?? undefined} alt={`Photo of ${itemName || 'this item'}`} />
        ) : (
          <ProductPlaceholder categorySlug={categorySlug} />
        )}
        {value.kind === 'replace' && <span className="bn-upload__badge">New photo — not saved yet</span>}
        {value.kind === 'remove' && <span className="bn-upload__badge">Photo will be removed on save</span>}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        onChange={handleFile}
        disabled={disabled}
        aria-describedby={error ? `${helpId} ${errorId}` : helpId}
      />

      <div className="bn-upload__actions">
        <label htmlFor={inputId} className={`btn btn-outline-secondary bn-btn-44${disabled ? ' disabled' : ''}`}>
          {hasPhoto ? 'Replace photo' : 'Choose photo'}
        </label>
        {value.kind === 'replace' && (
          <button type="button" className="btn btn-link bn-btn-44" onClick={() => onChange({ kind: 'keep' })} disabled={disabled}>
            Undo
          </button>
        )}
        {value.kind !== 'replace' && currentUrl && value.kind !== 'remove' && (
          <button type="button" className="btn btn-outline-danger bn-btn-44" onClick={() => onChange({ kind: 'remove' })} disabled={disabled}>
            Remove photo
          </button>
        )}
        {value.kind === 'remove' && (
          <button type="button" className="btn btn-link bn-btn-44" onClick={() => onChange({ kind: 'keep' })} disabled={disabled}>
            Keep current photo
          </button>
        )}
      </div>

      <p id={helpId} className="bn-help">
        JPEG, PNG or WebP, up to 10 MB. It will be shown cropped to this shape on the menu.
      </p>
      {error && (
        <p id={errorId} className="bn-field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
