'use client';
import { useFormContext, Controller } from 'react-hook-form';

interface FieldPerm {
  can_view?: boolean;
  can_edit?: boolean;
}

interface Props {
  name:           string;
  label:          string;
  required?:      boolean;
  disabled?:      boolean;
  min?:           string;          // YYYY-MM-DD
  max?:           string;          // YYYY-MM-DD
  disableFuture?: boolean;         // max = today
  disablePast?:   boolean;         // min = today
  hint?:          string;
  showFormatted?: boolean;         // show "15 Jan 2024" below input
  fieldPerm?:     FieldPerm;
  onChange?:      (value: string) => void;
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function FormDatePicker({
  name, label, required, disabled, min, max,
  disableFuture = false, disablePast = false,
  hint, showFormatted = true, fieldPerm, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  if (fieldPerm?.can_view === false) return null;

  const today      = toISO(new Date());
  const effectiveMin = disablePast  ? today : min;
  const effectiveMax = disableFuture ? today : max;
  const isReadOnly   = fieldPerm?.can_edit === false;
  const isDisabled   = disabled;
  const hintId       = `${name}-hint`;
  const errorId      = `${name}-error`;
  const describedBy  = [error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={[
          'form-field fg',
          error    ? 'err' : '',
          required ? 'req' : '',
        ].filter(Boolean).join(' ')}>

          <label htmlFor={name} className="field-label">
            {label}
            {required && <span className="req-mark" aria-hidden="true">*</span>}
          </label>

          <input
            {...field}
            id={name}
            type="date"
            min={effectiveMin}
            max={effectiveMax}
            disabled={isDisabled}
            readOnly={isReadOnly}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            value={field.value ?? ''}
            className={['form-input', isReadOnly ? 'readonly' : ''].filter(Boolean).join(' ')}
            onChange={e => {
              if (isReadOnly) return;
              field.onChange(e.target.value);
              onChange?.(e.target.value);
            }}
          />

          {/* Human-readable date shown below */}
          {showFormatted && field.value && !error && (
            <p className="field-hint" style={{ color: 'var(--ink3)' }}>
              📅 {formatDisplay(field.value)}
            </p>
          )}

          {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
          {error          && <p id={errorId} className="err" role="alert">{error}</p>}
        </div>
      )}
    />
  );
}
