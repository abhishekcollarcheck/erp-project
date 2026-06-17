'use client';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  name:       string;
  label:      string;
  hint?:      string;
  disabled?:  boolean;
  onChange?:  (v: boolean) => void;
}

export function FormCheckbox({ name, label, hint, disabled, onChange }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className="form-field">
        <label
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         10,
            cursor:      disabled ? 'not-allowed' : 'pointer',
            userSelect:  'none',
          }}
        >
          <input
            type="checkbox"
            checked={!!field.value}
            disabled={disabled}
            onChange={e => {
              field.onChange(e.target.checked);
              onChange?.(e.target.checked);
            }}
            style={{
              width:        18,
              height:       18,
              accentColor:  'var(--blue)',
              cursor:       disabled ? 'not-allowed' : 'pointer',
              flexShrink:   0,
            }}
          />
          <span style={{ fontSize: 13, color: disabled ? 'var(--ink4)' : 'var(--ink2)', fontWeight: 500 }}>
            {label}
          </span>
        </label>
        {hint && !error && <p className="field-hint" style={{ marginLeft: 28 }}>{hint}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    )} />
  );
}
