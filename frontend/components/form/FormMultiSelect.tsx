'use client';
import { useFormContext, Controller } from 'react-hook-form';
import type { FieldPerm } from './maskField';
import { MultiSelect } from 'primereact/multiselect';

interface Option {
  value: string | number;
  label: string;
}

interface Props {
  name:         string;
  label:        string;
  options:      Option[];
  required?:    boolean;
  disabled?:    boolean;
  placeholder?: string;
  hint?:        string;
  maxItems?:    number;
  fieldPerm?:   FieldPerm;
  onChange?:    (values: (string | number)[]) => void;
}

export function FormMultiSelect({
  name, label, options, required, disabled, placeholder = 'Select options…',
  hint, maxItems, fieldPerm, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error      = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled = disabled || fieldPerm?.can_edit === false || !!fieldPerm?.is_masked || !!fieldPerm?.is_partial_masked;

  return (
    <Controller name={name} control={control} render={({ field }) => {
      const selected: (string | number)[] = Array.isArray(field.value) ? field.value : [];

      return (
        <div className={`form-field fg${error ? ' err' : ''}${required ? ' req' : ''}`}>
          <label className="field-label">
            {label}
            {required && <span className="req-mark">*</span>}
            {maxItems && <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 6 }}>max {maxItems}</span>}
          </label>

          <MultiSelect
            value={selected}
            options={options}
            optionLabel="label"
            optionValue="value"
            placeholder={placeholder}
            disabled={isDisabled}
            filter
            display="chip"
            selectionLimit={maxItems}
            showSelectAll={!maxItems}
            className="w-full"
            style={{ width: '100%' }}
            onChange={(e) => {
              const next = (e.value ?? []) as (string | number)[];
              field.onChange(next);
              onChange?.(next);
            }}
            onBlur={field.onBlur}
          />

          {hint && !error && <p className="field-hint">{hint}</p>}
          {error && <p className="field-error" role="alert">{error}</p>}
        </div>
      );
    }} />
  );
}
