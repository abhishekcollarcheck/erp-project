'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { FieldPerm } from './maskField';
import { AutoComplete } from 'primereact/autocomplete';

interface Option {
  value: string | number;
  label: string;
  meta?:  Record<string, unknown>;
}

interface Props {
  name:          string;
  label:         string;
  required?:     boolean;
  disabled?:     boolean;
  placeholder?:  string;
  hint?:         string;
  minChars?:     number;   // minimum chars before searching, default 2
  debounceMs?:   number;   // default 350
  fieldPerm?:    FieldPerm;
  // Called with the search query — must return Option[]
  loadOptions:   (query: string) => Promise<Option[]>;
  // Called when an option is selected (for side effects like setting related fields)
  onSelect?:     (option: Option) => void;
  /** Optional: initial label to show when the form loads with a pre-set value. */
  initialLabel?: string;
}

export function FormAsyncSelect({
  name, label, required, disabled, placeholder = 'Type to search…',
  hint, minChars = 2, debounceMs = 350, fieldPerm, loadOptions, onSelect,
  initialLabel,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error       = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled  = disabled || fieldPerm?.can_edit === false || !!fieldPerm?.is_masked || !!fieldPerm?.is_partial_masked;

  const [selected,    setSelected]    = useState<Option | null>(
    initialLabel ? { value: '', label: initialLabel } : null,
  );
  const [suggestions, setSuggestions] = useState<Option[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const complete = useCallback((query: string) => {
    if (!query || query.length < minChars) { setSuggestions([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setSuggestions(await loadOptions(query));
      } catch {
        setSuggestions([]);
      }
    }, debounceMs);
  }, [minChars, debounceMs, loadOptions]);

  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className={`form-field fg${error ? ' err' : ''}${required ? ' req' : ''}`}>
        <label className="field-label">
          {label}
          {required && <span className="req-mark">*</span>}
        </label>

        <AutoComplete
          value={selected}
          suggestions={suggestions}
          completeMethod={(e) => complete(e.query)}
          field="label"
          disabled={isDisabled}
          placeholder={placeholder}
          dropdown={false}
          forceSelection
          delay={0}
          inputClassName="form-input"
          style={{ width: '100%' }}
          onChange={(e) => {
            setSelected(e.value);
            // While the user is typing, e.value is a string; only an object
            // (a real pick) carries a stable id for the form.
            if (!e.value || typeof e.value === 'string') {
              if (field.value) field.onChange(null);
            }
          }}
          onSelect={(e) => {
            const opt = e.value as Option;
            setSelected(opt);
            field.onChange(opt.value);
            onSelect?.(opt);
          }}
          onBlur={field.onBlur}
        />

        {field.value && selected?.label && (
          <p className="field-hint" style={{ color: 'var(--green)' }}>
            ✓ Selected: {selected.label}
          </p>
        )}
        {hint && !error && !field.value && <p className="field-hint">{hint}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    )} />
  );
}
