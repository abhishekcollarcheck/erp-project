'use client';
import { useFieldArray, useFormContext } from 'react-hook-form';

interface Props {
  name:          string;
  label:         string;
  addLabel?:     string;
  defaultItem:   Record<string, unknown>;
  maxItems?:     number;
  emptyMessage?: string;
  disabled?:     boolean;
  renderItem: (
    index:  number,
    remove: () => void,
    prefix: string,      // e.g. `education.0.`
  ) => React.ReactNode;
}

export function FormArraySection({
  name, label, addLabel = 'Add', defaultItem,
  maxItems = 10, emptyMessage, disabled, renderItem,
}: Props) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="form-array-section">
      {/* Header */}
      <div style={{
        display:       'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom:  12, paddingBottom: 10, borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {label}
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink4)', marginLeft: 6 }}>
            ({fields.length}{maxItems < 99 ? ` / ${maxItems}` : ''})
          </span>
        </span>
        {!disabled && fields.length < maxItems && (
          <button
            type="button"
            onClick={() => append(defaultItem)}
            style={{
              display:      'flex', alignItems: 'center', gap: 5,
              padding:      '5px 12px', borderRadius: 'var(--r)',
              border:       '1px solid var(--blue-md)', background: 'var(--blue-lt)',
              color:        'var(--blue)', fontSize: 12, fontWeight: 600,
              cursor:       'pointer', transition: 'all .15s',
            }}
          >
            + {addLabel}
          </button>
        )}
      </div>

      {/* Empty state */}
      {fields.length === 0 && emptyMessage && (
        <div style={{
          padding:   '20px 16px', textAlign: 'center',
          color:     'var(--ink4)', fontSize: 12,
          border:    '1px dashed var(--border)', borderRadius: 'var(--r2)',
          background:'var(--surface2)',
        }}>
          {emptyMessage}
        </div>
      )}

      {/* Items */}
      <div style={{ display: 'grid', gap: 16 }}>
        {fields.map((field, idx) => (
          <div
            key={field.id}
            style={{
              border:       '1px solid var(--border)', borderRadius: 'var(--r2)',
              padding:      16, position: 'relative',
            }}
          >
            {/* Item header */}
            <div style={{
              display:      'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 14,
            }}>
              <span style={{
                fontSize:   11, fontWeight: 700, color: 'var(--ink4)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                #{idx + 1}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  style={{
                    background: 'none', border: '1px solid var(--red-bd)',
                    color:      'var(--red)', borderRadius: 'var(--r)',
                    padding:    '2px 8px', cursor: 'pointer',
                    fontSize:   11, fontWeight: 500,
                  }}
                >
                  × Remove
                </button>
              )}
            </div>

            {/* Render the item fields */}
            {renderItem(idx, () => remove(idx), `${name}.${idx}.`)}
          </div>
        ))}
      </div>

      {/* Max reached notice */}
      {fields.length >= maxItems && (
        <p style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 8, textAlign: 'center' }}>
          Maximum of {maxItems} items reached.
        </p>
      )}
    </div>
  );
}
