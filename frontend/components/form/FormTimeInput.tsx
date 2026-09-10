'use client';
import { useFormContext, Controller } from 'react-hook-form';
import type { FieldPerm } from './maskField';
import { maskPartial } from '../../utils/validationEngine';

interface Props {
  name:       string;
  label:      string;
  required?:  boolean;
  disabled?:  boolean;
  hint?:      string;
  fieldPerm?: FieldPerm;
  onChange?:  (value: string) => void;
}

export function FormTimeInput({
  name, label, required, disabled, hint, fieldPerm, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  if (fieldPerm?.can_view === false) return null;

  const isFullMask    = fieldPerm?.is_masked === true;
  const isPartialMask = !isFullMask && fieldPerm?.is_partial_masked === true;
  const isReadOnly  = fieldPerm?.can_edit === false || isFullMask || isPartialMask;
  const isDisabled  = disabled;
  const hintId      = `${name}-hint`;
  const errorId     = `${name}-error`;
  const describedBy = [error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined;

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
            type={isFullMask ? 'password' : isPartialMask ? 'text' : 'time'}
            disabled={isDisabled}
            readOnly={isReadOnly}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            value={isPartialMask ? maskPartial(field.value ?? '') : isFullMask ? '••••••' : (field.value ?? '')}
            className={['form-input', isReadOnly ? 'readonly' : '', (isFullMask || isPartialMask) ? 'masked' : ''].filter(Boolean).join(' ')}
            onChange={e => {
              if (isReadOnly) return;
              field.onChange(e.target.value);
              onChange?.(e.target.value);
            }}
          />

          {hint  && !error && <p id={hintId}  className="field-hint">{hint}</p>}
          {error && <p id={errorId} className="err" role="alert">{error}</p>}
        </div>
      )}
    />
  );
}
