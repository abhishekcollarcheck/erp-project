'use client';
import { useFormContext, Controller } from 'react-hook-form';
import type { FieldPerm } from './maskField';
import { maskPartial } from '../../utils/validationEngine';

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
  fieldPerm?:   FieldPerm;
}

export function FormTextarea({
  name, label, placeholder, required, disabled, readOnly,
  rows = 3, maxLength, hint, fieldPerm,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error       = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isFullMask    = fieldPerm?.is_masked === true;
  const isPartialMask = !isFullMask && fieldPerm?.is_partial_masked === true;
  const isReadOnly  = readOnly || fieldPerm?.can_edit === false || isFullMask || isPartialMask;

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
          value={isFullMask ? '••••••' : isPartialMask ? maskPartial(field.value ?? '') : (field.value ?? '')}
          className={`w-full border border-gray-300 p-2 rounded-2xl form-textarea${isReadOnly ? ' readonly' : ''}${(isFullMask || isPartialMask) ? ' masked' : ''}`}
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
