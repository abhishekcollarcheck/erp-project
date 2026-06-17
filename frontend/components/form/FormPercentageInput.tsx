'use client';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  name:       string;
  label:      string;
  required?:  boolean;
  min?:       number;
  max?:       number;
  step?:      number;
  hint?:      string;
  disabled?:  boolean;
  fieldPerm?: { can_view?: boolean; can_edit?: boolean };
}

export function FormPercentageInput({
  name, label, required, min = 0, max = 100, step = 0.01, hint, disabled, fieldPerm,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error      = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled = disabled || fieldPerm?.can_edit === false;

  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`}>
        <label htmlFor={name} className="field-label">
          {label}
          {required && <span className="req-mark">*</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={name}
            type="number"
            min={min}
            max={max}
            step={step}
            disabled={isDisabled}
            aria-invalid={!!error}
            className="form-input"
            style={{ paddingRight: 32 }}
            value={field.value ?? ''}
            onChange={e => {
              const v = e.target.value === '' ? null : Number(e.target.value);
              field.onChange(v);
            }}
          />
          <span style={{
            position:  'absolute', right: 10,
            top:       '50%', transform: 'translateY(-50%)',
            fontSize:  13, color: 'var(--ink3)', pointerEvents: 'none',
          }}>%</span>
        </div>

        {/* Visual bar */}
        {field.value != null && field.value >= 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height:     '100%',
                width:      `${Math.min(100, Math.max(0, Number(field.value)))}%`,
                background: Number(field.value) >= 80 ? 'var(--green)' : Number(field.value) >= 50 ? 'var(--blue)' : 'var(--amber)',
                borderRadius: 2, transition: 'width .3s',
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 2 }}>{field.value}% of {max}%</div>
          </div>
        )}

        {hint && !error && <p className="field-hint">{hint}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    )} />
  );
}
