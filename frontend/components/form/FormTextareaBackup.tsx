'use client';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  name:         string;
  label:        string;
  placeholder?: string;
  required?:    boolean;
  disabled?:    boolean;
  readOnly?:    boolean;
  rows?:        number;
  maxLength?:   number;
  hint?:        string;
  fieldPerm?:   { can_view?: boolean; can_edit?: boolean };
}

export function FormTextarea({
  name, label, placeholder, required, disabled, readOnly,
  rows = 3, maxLength, hint, fieldPerm,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error       = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isReadOnly  = readOnly || fieldPerm?.can_edit === false;

  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`}>
        <label htmlFor={name} className="field-label">
          {label}
          {required && <span className="req-mark">*</span>}
        </label>
        <textarea
          {...field}
          id={name}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={isReadOnly}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-err` : hint ? `${name}-hint` : undefined}
          value={field.value ?? ''}
          className={`form-textarea${isReadOnly ? ' readonly' : ''}`}
          onChange={e => { if (!isReadOnly) field.onChange(e.target.value); }}
        />
        {maxLength && (
          <div style={{ fontSize: 10, color: 'var(--ink4)', textAlign: 'right', marginTop: 2 }}>
            {(field.value ?? '').length} / {maxLength}
          </div>
        )}
        {hint && !error && <p id={`${name}-hint`} className="field-hint">{hint}</p>}
        {error && <p id={`${name}-err`} className="field-error" role="alert">{error}</p>}
      </div>
    )} />
  );
}
