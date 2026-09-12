'use client';
import { useFormContext, Controller } from 'react-hook-form';
import type { FieldPerm } from './maskField';

interface Props {
  name:       string;
  label:      string;
  hint?:      string;
  disabled?:  boolean;
  onChange?:  (v: boolean) => void;
  fieldPerm?: FieldPerm;
}

export function FormCheckbox({ name, label, hint, disabled, onChange, fieldPerm }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  if (fieldPerm?.can_view === false) return null;
  // A boolean can't be partially masked — any mask just locks it read-only.
  const locked = disabled || fieldPerm?.can_edit === false || !!fieldPerm?.is_masked || !!fieldPerm?.is_partial_masked;

  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className="form-field">
        <label
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         10,
            cursor:      locked ? 'not-allowed' : 'pointer',
            userSelect:  'none',
          }}
        >
          <input
            type="checkbox"
            checked={!!field.value}
            disabled={locked}
            onChange={e => {
              field.onChange(e.target.checked);
              onChange?.(e.target.checked);
            }}
            style={{
              width:        18,
              height:       18,
              accentColor:  'var(--blue)',
              cursor:       locked ? 'not-allowed' : 'pointer',
              flexShrink:   0,
            }}
          />
          <span style={{ fontSize: 13, color: locked ? 'var(--ink4)' : 'var(--ink2)', fontWeight: 500 }}>
            {label}
          </span>
        </label>
        {hint && !error && <p className="field-hint" style={{ marginLeft: 28 }}>{hint}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    )} />
  );
}
