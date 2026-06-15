'use client';
/**
 * FormSelect.tsx
 * Native <select> dropdown, RHF Controller-wrapped.
 * ─ Permission-aware: hidden / readonly by role
 * ─ Grouped options support via OptGroup
 * ─ onChange side-effect callback for dependent field chains
 *   (e.g. Department → clears Designation on change)
 */

import { useFormContext, Controller } from 'react-hook-form';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface OptGroup {
  group: string;
  options: Option[];
}

interface FieldPerm {
  can_view?: boolean;
  can_edit?: boolean;
}

interface Props {
  name: string;
  label: string;
  options: Option[] | OptGroup[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;   // Empty first option label
  hint?: string;
  fieldPerm?: FieldPerm;
  onChange?: (value: string) => void;
}

function isOptGroup(o: Option | OptGroup): o is OptGroup {
  return 'group' in o;
}

export function FormSelect({
  name, label, options, required, disabled, placeholder, hint, fieldPerm, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  if (fieldPerm?.can_view === false) return null;

  const isDisabled = disabled || fieldPerm?.can_edit === false;
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const describedBy = [error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined;

  const renderOptions = (opts: Option[]) =>
    opts.map(o => (
      <option key={o.value} value={o.value} disabled={o.disabled}>
        {o.label}
      </option>
    ));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={[
          'form-field',
          error ? 'err' : '',
          required ? 'req' : '',
        ].filter(Boolean).join(' ')}>
          <div className="fg">
            <label htmlFor={name} className="field-label">
              {label}
              {required && <span className="req-mark" aria-hidden="true">*</span>}
            </label>


            <select
              {...field}
              id={name}
              disabled={isDisabled}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              aria-required={required}
              className="form-select"
              value={field.value ?? ''}
              onChange={e => {
                field.onChange(e.target.value);
                onChange?.(e.target.value);
              }}
            >
              {/* Empty placeholder option */}
              {placeholder !== undefined && (
                <option value="" disabled={required}>
                  {placeholder}
                </option>
              )}

              {/* Flat or grouped options */}
              {(options as any[]).map((o, i) =>
                isOptGroup(o) ? (
                  <optgroup key={o.group} label={o.group}>
                    {renderOptions(o.options)}
                  </optgroup>
                ) : (
                  <option key={(o as Option).value} value={(o as Option).value} disabled={(o as Option).disabled}>
                    {(o as Option).label}
                  </option>
                )
              )}
            </select>
          </div>

          {hint && !error && <p id={hintId} className="field-hint">{hint}</p>}
          {error && <p id={errorId} className="err" role="alert">{error}</p>}
        </div>
      )}
    />
  );
}
