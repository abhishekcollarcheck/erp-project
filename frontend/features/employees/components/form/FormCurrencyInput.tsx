'use client';
/**
 * FormCurrencyInput.tsx
 * Indian Rupee currency input with live formatting display.
 * ─ RHF Controller-wrapped — stores raw number (not string)
 * ─ Permission-aware: masked (••••••••) when is_masked=true
 * ─ Live display: "₹1,68,500 (1.69L)" shown below input
 * ─ Validation-safe: stores null when empty, not 0
 * ─ No browser arrow spinners (hidden via CSS)
 */

import { useFormContext, Controller } from 'react-hook-form';

interface FieldPerm {
  can_view?: boolean;
  can_edit?: boolean;
  is_masked?: boolean;
}

interface Props {
  name:       string;
  label:      string;
  required?:  boolean;
  disabled?:  boolean;
  min?:       number;
  max?:       number;
  hint?:      string;
  fieldPerm?: FieldPerm;
  onChange?:  (value: number | null) => void;
}

/** Format number in Indian notation: 1,68,500 */
function fmtIN(n: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

/** Compact: 1.69L, 2.3Cr */
function fmtShort(n: number): string {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(2)} L`;
  return '';
}

export function FormCurrencyInput({
  name, label, required, disabled, min = 0, max, hint, fieldPerm, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  // Field-level visibility gate
  if (fieldPerm?.can_view === false) return null;

  // Masked view — role cannot see value
  if (fieldPerm?.is_masked) {
    return (
      <div className="form-field">
        <label className="field-label">
          {label}
          <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 5 }} title="Masked by role">🔒</span>
        </label>
        <input
          type="password"
          value="••••••"
          readOnly
          className="form-input masked"
          aria-label={`${label} — masked`}
          tabIndex={-1}
        />
      </div>
    );
  }

  const isDisabled  = disabled || fieldPerm?.can_edit === false;
  const hintId      = `${name}-hint`;
  const errorId     = `${name}-error`;
  const describedBy = [error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const raw     = field.value;
        const numVal  = raw != null && raw !== '' ? Number(raw) : null;
        const display = numVal != null && !isNaN(numVal) && numVal > 0;

        return (
          <div className={[
            'form-field',
            error    ? 'err' : '',
            required ? 'req' : '',
          ].filter(Boolean).join(' ')}>

            <label htmlFor={name} className="field-label">
              {label}
              {required && <span className="req-mark" aria-hidden="true">*</span>}
            </label>

            <div style={{ position: 'relative' }}>
              {/* Rupee prefix */}
              <span style={{
                position:     'absolute',
                left:         10,
                top:          '50%',
                transform:    'translateY(-50%)',
                color:        isDisabled ? 'var(--ink4)' : 'var(--ink3)',
                fontSize:     13,
                fontWeight:   500,
                pointerEvents:'none',
                userSelect:   'none',
                zIndex:       1,
              }}>
                ₹
              </span>

              <input
                id={name}
                type="number"
                min={min}
                max={max}
                step="1"
                disabled={isDisabled}
                aria-invalid={!!error}
                aria-describedby={describedBy}
                aria-required={required}
                className="form-input"
                style={{ paddingLeft: 24 }}
                value={raw ?? ''}
                onChange={e => {
                  const val = e.target.value === '' ? null : Number(e.target.value);
                  field.onChange(val);
                  onChange?.(val);
                }}
                onBlur={field.onBlur}
              />
            </div>

            {/* Live formatted display */}
            {display && numVal != null && (
              <p className="field-hint" style={{ color: 'var(--ink3)' }}>
                ₹{fmtIN(numVal)}
                {fmtShort(numVal) && (
                  <span style={{ marginLeft: 6, color: 'var(--blue)', fontWeight: 600 }}>
                    ({fmtShort(numVal)})
                  </span>
                )}
              </p>
            )}

            {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
            {error          && <p id={errorId} className="field-error" role="alert">{error}</p>}
          </div>
        );
      }}
    />
  );
}
