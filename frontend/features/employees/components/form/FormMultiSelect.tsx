'use client';
import { useState, useRef, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

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
  fieldPerm?:   { can_view?: boolean; can_edit?: boolean };
  onChange?:    (values: (string | number)[]) => void;
}

export function FormMultiSelect({
  name, label, options, required, disabled, placeholder = 'Select options…',
  hint, maxItems, fieldPerm, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error      = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled = disabled || fieldPerm?.can_edit === false;

  const [search, setSearch]   = useState('');
  const [isOpen, setIsOpen]   = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Controller name={name} control={control} render={({ field }) => {
      const selected: (string | number)[] = Array.isArray(field.value) ? field.value : [];

      const toggle = (val: string | number) => {
        let next: (string | number)[];
        if (selected.includes(val)) {
          next = selected.filter(v => v !== val);
        } else {
          if (maxItems && selected.length >= maxItems) return;
          next = [...selected, val];
        }
        field.onChange(next);
        onChange?.(next);
      };

      const remove = (val: string | number) => {
        const next = selected.filter(v => v !== val);
        field.onChange(next);
        onChange?.(next);
      };

      const labelOf = (val: string | number) =>
        options.find(o => o.value === val)?.label ?? String(val);

      return (
        <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`} ref={wrapRef}>
          <label className="field-label">
            {label}
            {required && <span className="req-mark">*</span>}
            {maxItems && <span style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 6 }}>max {maxItems}</span>}
          </label>

          {/* Selected tags */}
          {selected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
              {selected.map(val => (
                <span
                  key={val}
                  style={{
                    display:      'inline-flex', alignItems: 'center', gap: 5,
                    padding:      '2px 8px', borderRadius: 99,
                    background:   'var(--blue-lt)', color: 'var(--blue)',
                    border:       '1px solid var(--blue-md)', fontSize: 11, fontWeight: 600,
                  }}
                >
                  {labelOf(val)}
                  {!isDisabled && (
                    <button
                      type="button"
                      onClick={() => remove(val)}
                      style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                    >×</button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Trigger */}
          <div
            style={{
              border:       `1px solid ${isOpen ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 'var(--r)', padding: '6px 10px',
              background:   isDisabled ? 'var(--surface2)' : 'var(--surface)',
              cursor:       isDisabled ? 'not-allowed' : 'pointer',
              display:      'flex', alignItems: 'center', gap: 8, position: 'relative',
            }}
            onClick={() => !isDisabled && setIsOpen(o => !o)}
          >
            <input
              type="text"
              value={search}
              placeholder={selected.length ? 'Add more…' : placeholder}
              disabled={isDisabled}
              onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
              onClick={e => e.stopPropagation()}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: 'var(--ink)', fontFamily: 'var(--font)' }}
            />
            <span style={{ color: 'var(--ink4)', fontSize: 10 }}>▼</span>
          </div>

          {/* Dropdown */}
          {isOpen && !isDisabled && (
            <div style={{
              position:    'absolute', zIndex: 200, left: 0, right: 0,
              background:  'var(--surface)', border: '1px solid var(--border)',
              borderRadius:'var(--r)', boxShadow: 'var(--sh2)',
              maxHeight:   220, overflowY: 'auto', marginTop: 2,
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: 'var(--ink4)' }}>No options found</div>
              ) : filtered.map(opt => {
                const isSelected = selected.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    style={{
                      display:      'flex', alignItems: 'center', gap: 10,
                      padding:      '8px 12px', cursor: 'pointer', fontSize: 12,
                      borderBottom: '1px solid var(--border)',
                      background:   isSelected ? 'var(--blue-lt)' : 'transparent',
                      color:        isSelected ? 'var(--blue)' : 'var(--ink2)',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{isSelected ? '☑' : '☐'}</span>
                    {opt.label}
                  </div>
                );
              })}
            </div>
          )}

          {hint && !error && <p className="field-hint">{hint}</p>}
          {error && <p className="field-error" role="alert">{error}</p>}
        </div>
      );
    }} />
  );
}
