import { useId } from 'react';
import type { ItemOptionType } from '@/types/menu';
import './OptionsEditor.css';

export interface OptionDraft {
  key: string;
  type: ItemOptionType;
  name: string;
}

export interface OptionsEditorProps {
  value: OptionDraft[];
  onChange: (next: OptionDraft[]) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

let keySeq = 0;
export const newOptionKey = () => `opt-${++keySeq}`;

/**
 * Informational flavors / add-ons (no prices — included in the item price).
 * Empty at launch; the PDF's flavor text stays in the descriptions.
 */
export default function OptionsEditor({ value, onChange, errors, disabled }: OptionsEditorProps) {
  const uid = useId();

  function update(key: string, patch: Partial<OptionDraft>) {
    onChange(value.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  }

  return (
    <fieldset className="bn-options">
      <legend className="form-label">
        Flavors &amp; add-ons <span className="bn-optional">(optional, informational — no extra price)</span>
      </legend>

      {value.length === 0 && <p className="bn-help mb-2">None. Flavors written in the description are kept as they are.</p>}

      <ul className="bn-options__list" role="list">
        {value.map((o, i) => {
          const nameId = `${uid}-name-${o.key}`;
          const err = errors[o.key];
          return (
            <li key={o.key} className="bn-options__row">
              <label className="visually-hidden" htmlFor={`${uid}-type-${o.key}`}>
                Option {i + 1} type
              </label>
              <select
                id={`${uid}-type-${o.key}`}
                className="form-select bn-options__type"
                value={o.type}
                onChange={(e) => update(o.key, { type: e.target.value as ItemOptionType })}
                disabled={disabled}
              >
                <option value="flavor">Flavor</option>
                <option value="addon">Add-on</option>
              </select>
              <div className="bn-options__name">
                <label className="visually-hidden" htmlFor={nameId}>
                  Option {i + 1} name
                </label>
                <input
                  id={nameId}
                  className={`form-control${err ? ' is-invalid' : ''}`}
                  value={o.name}
                  maxLength={60}
                  placeholder="e.g. Caramel"
                  onChange={(e) => update(o.key, { name: e.target.value })}
                  aria-invalid={err ? true : undefined}
                  aria-describedby={err ? `${nameId}-error` : undefined}
                  disabled={disabled}
                />
                {err && (
                  <div id={`${nameId}-error`} className="invalid-feedback">
                    {err}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary bn-btn-44 bn-options__remove"
                onClick={() => onChange(value.filter((x) => x.key !== o.key))}
                disabled={disabled}
              >
                Remove<span className="visually-hidden"> option {i + 1}{o.name ? ` (${o.name})` : ''}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="btn btn-outline-secondary bn-btn-44"
        onClick={() => onChange([...value, { key: newOptionKey(), type: 'flavor', name: '' }])}
        disabled={disabled}
      >
        + Add flavor or add-on
      </button>
    </fieldset>
  );
}
