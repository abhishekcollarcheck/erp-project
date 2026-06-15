'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

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
  fieldPerm?:    { can_view?: boolean; can_edit?: boolean };
  // Called with the search query — must return Option[]
  loadOptions:   (query: string) => Promise<Option[]>;
  // Called when an option is selected (for side effects like setting related fields)
  onSelect?:     (option: Option) => void;
}

export function FormAsyncSelect({
  name, label, required, disabled, placeholder = 'Type to search…',
  hint, minChars = 2, debounceMs = 350, fieldPerm, loadOptions, onSelect,
}: Props) {
  const { control, formState: { errors }, setValue } = useFormContext();
  const error       = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled  = disabled || fieldPerm?.can_edit === false;

  const [query,     setQuery]     = useState('');
  const [options,   setOptions]   = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen,    setIsOpen]    = useState(false);
  const [selected,  setSelected]  = useState<Option | null>(null);
  const timer  = useRef<ReturnType<typeof setTimeout>>();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (q.length < minChars) { setOptions([]); setIsOpen(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const opts = await loadOptions(q);
        setOptions(opts);
        setIsOpen(true);
      } catch { setOptions([]); }
      finally { setIsLoading(false); }
    }, debounceMs);
  }, [minChars, debounceMs, loadOptions]);

  const pick = (opt: Option, fieldOnChange: (v: any) => void) => {
    setSelected(opt);
    setQuery(opt.label);
    setIsOpen(false);
    fieldOnChange(opt.value);
    onSelect?.(opt);
  };

  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`} ref={wrapRef}>
        <label className="field-label">
          {label}
          {required && <span className="req-mark">*</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={query}
            disabled={isDisabled}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            className="form-input"
            onChange={e => search(e.target.value)}
            onFocus={() => { if (options.length && query.length >= minChars) setIsOpen(true); }}
            style={{ paddingRight: isLoading ? 36 : undefined }}
          />
          {isLoading && (
            <span style={{
              position: 'absolute', right: 10, top: '50%',
              transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink4)',
            }}>
              ⟳
            </span>
          )}
          {field.value && !isLoading && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSelected(null); setOptions([]); field.onChange(null); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--ink4)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            >×</button>
          )}

          {/* Dropdown */}
          {isOpen && options.length > 0 && (
            <div style={{
              position:    'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
              background:  'var(--surface)', border: '1px solid var(--border)',
              borderRadius:'var(--r)', boxShadow: 'var(--sh2)',
              maxHeight:   220, overflowY: 'auto', marginTop: 2,
            }}>
              {options.map(opt => (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={field.value === opt.value}
                  onClick={() => pick(opt, field.onChange)}
                  style={{
                    padding:    '9px 12px',
                    cursor:     'pointer',
                    fontSize:   12,
                    borderBottom: '1px solid var(--border)',
                    background: field.value === opt.value ? 'var(--blue-lt)' : 'transparent',
                    color:      field.value === opt.value ? 'var(--blue)' : 'var(--ink2)',
                    transition: 'background .1s',
                  }}
                  onMouseOver={e => { if (field.value !== opt.value) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
                  onMouseOut={e => { if (field.value !== opt.value) (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}

          {isOpen && !isLoading && options.length === 0 && query.length >= minChars && (
            <div style={{
              position:    'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
              background:  'var(--surface)', border: '1px solid var(--border)',
              borderRadius:'var(--r)', padding: '12px', textAlign: 'center',
              fontSize:    12, color: 'var(--ink4)', marginTop: 2,
            }}>
              No results for "{query}"
            </div>
          )}
        </div>

        {field.value && selected && (
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
