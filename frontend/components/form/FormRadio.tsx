'use client';
import { useFormContext, Controller } from 'react-hook-form';

interface Option {
  value:    string | number;
  label:    string;
  hint?:    string;
  disabled?: boolean;
}

interface Props {
  name:       string;
  label:      string;
  options:    Option[];
  required?:  boolean;
  disabled?:  boolean;
  layout?:    'vertical' | 'horizontal';
  hint?:      string;
  fieldPerm?: { can_view?: boolean; can_edit?: boolean };
  onChange?:  (v: string) => void;
}

export function FormRadio({
  name, label, options, required, disabled, layout = 'vertical', hint, fieldPerm, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled = disabled || fieldPerm?.can_edit === false;

  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`}>
        <span className="field-label">
          {label}
          {required && <span className="req-mark">*</span>}
        </span>
        <div
          role="radiogroup"
          aria-label={label}
          style={{
            display:       layout === 'horizontal' ? 'flex' : 'grid',
            flexWrap:      'wrap',
            gap:           layout === 'horizontal' ? '16px' : '8px',
            marginTop:     4,
          }}
        >
          {options.map(opt => {
            const checked = String(field.value) === String(opt.value);
            const optDisabled = isDisabled || opt.disabled;
            return (
              <label
                key={opt.value}
                style={{
                  display:    'flex',
                  alignItems: 'flex-start',
                  gap:        8,
                  cursor:     optDisabled ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                  opacity:    optDisabled ? 0.55 : 1,
                }}
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={checked}
                  disabled={optDisabled}
                  onChange={() => {
                    if (optDisabled) return;
                    field.onChange(opt.value);
                    onChange?.(String(opt.value));
                  }}
                  style={{ width: 16, height: 16, accentColor: 'var(--blue)', marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <span style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: checked ? 600 : 400 }}>
                    {opt.label}
                  </span>
                  {opt.hint && (
                    <p style={{ fontSize: 11, color: 'var(--ink4)', margin: '1px 0 0' }}>{opt.hint}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    )} />
  );
}
