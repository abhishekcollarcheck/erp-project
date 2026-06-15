'use client';

import { useFormContext, Controller } from 'react-hook-form';

interface FieldPerm {
  can_view?: boolean;
  can_edit?: boolean;
  is_masked?: boolean;
}

interface Props {
  name:         string;
  label:        string;
  type?:        'text' | 'email' | 'number' | 'password' | 'tel' | 'url' | 'search';
  placeholder?: string;
  required?:    boolean;
  disabled?:    boolean;
  readOnly?:    boolean;
  hint?:        string;
  maxLength?:   number;
  min?:         string | number;
  max?:         string | number;
  step?:        string | number;
  prefix?:      React.ReactNode;   // e.g. "₹" or an icon
  suffix?:      React.ReactNode;   // e.g. "%" or an icon
  autoComplete?:string;
  fieldPerm?:   FieldPerm;
  onChange?:    (value: string) => void;
  onBlur?:      () => void;
}

export function FormInput({
  name, label, type = 'text', placeholder, required, disabled, readOnly,
  hint, maxLength, min, max, step, prefix, suffix, autoComplete,
  fieldPerm, onChange, onBlur,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  // Field-level visibility gate
  if (fieldPerm?.can_view === false) return null;

  const isReadOnly   = readOnly || fieldPerm?.can_edit === false;
  const isDisabled   = disabled;
  const displayType  = fieldPerm?.is_masked ? 'password' : type;
  const hintId       = `${name}-hint`;
  const errorId      = `${name}-error`;
  const describedBy  = [error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={[
          'form-field',
          error    ? 'err' : '',
          required ? 'req' : '',
        ].filter(Boolean).join(' ')}>
          <div className='fg'> 
          <label htmlFor={name} className="field-label">
            {label}
            {required && <span className="req-mark" aria-hidden="true">*</span>}
            {fieldPerm?.is_masked && (
              <span
                style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}
                title="This field is masked based on your role"
              >🔒</span>
            )}
          </label>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Prefix */}
            {prefix && (
              <span style={{
                position:    'absolute',
                left:        10,
                color:       'var(--ink3)',
                fontSize:    13,
                pointerEvents: 'none',
                userSelect:  'none',
                zIndex:      1,
              }}>
                {prefix}
              </span>
            )}

            <input 
              {...field}
              id={name}
              type={displayType}
              placeholder={placeholder}
              disabled={isDisabled}
              readOnly={isReadOnly}
              maxLength={maxLength}
              min={min}
              max={max}
              step={step}
              autoComplete={autoComplete}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              aria-required={required}
              value={field.value ?? ''}
              className={[
                'form-input',
                isReadOnly ? 'readonly' : '',
                fieldPerm?.is_masked ? 'masked' : '',
              ].filter(Boolean).join(' ')}
              style={{
                paddingLeft:  prefix ? 28 : undefined,
                paddingRight: suffix ? 28 : undefined,
                flex: '1 1 0%',
              }}
              onChange={e => {
                if (isReadOnly) return;
                field.onChange(e.target.value);
                onChange?.(e.target.value);
              }}
              onBlur={() => {
                field.onBlur();
                onBlur?.();
              }}
            />

            {/* Suffix */}
            {suffix && (
              <span style={{
                position:    'absolute',
                right:       10,
                color:       'var(--ink3)',
                fontSize:    13,
                pointerEvents: 'none',
                userSelect:  'none',
              }}>
                {suffix}
              </span>
            )}
          </div>

          {/* {hint && !error && (
            <p id={hintId} className="field-hint">{hint}</p>
          )} */}
          {error && (
            <p id={errorId} className="err" role="alert">{error}</p>
          )}
          </div>
        </div>
      )}
    />
  );
}
