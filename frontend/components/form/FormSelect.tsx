'use client';
/**
 * FormSelect.tsx
 * Searchable select — built with CSS variables from the existing design system.
 * No external library needed. Drop-in replacement for the previous native <select>.
 *
 * What changed vs previous version:
 *  - Typing in the control filters options in real time (case-insensitive)
 *  - Grouped options (OptGroup) work identically — groups are searchable too
 *  - Clearable: clicking ✕ clears the value (when not required)
 *  - Keyboard: ArrowUp/Down navigate, Enter selects, Escape closes
 *  - All existing props kept: name, label, options, required, disabled,
 *    placeholder, hint, fieldPerm, onChange
 *
 * What is unchanged:
 *  - RHF Controller integration (fieldState.error, field.onChange, field.onBlur)
 *  - Permission-aware visibility / read-only
 *  - Error / hint rendering, label, required mark
 *  - CSS variables: --border, --blue, --red, --ink*, --surface*, --r, --sh2
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext, Controller }               from 'react-hook-form';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Option {
  value:     string | number;
  label:     string;
  disabled?: boolean;
}

export interface OptGroup {
  group:   string;
  options: Option[];
}

interface FieldPerm {
  can_view?: boolean;
  can_edit?: boolean;
}

interface Props {
  name:         string;
  label:        string;
  options:      Option[] | OptGroup[];
  required?:    boolean;
  disabled?:    boolean;
  placeholder?: string;
  hint?:        string;
  fieldPerm?:   FieldPerm;
  clearable?:   boolean;  // new: show ✕ when a value is selected (default false when required, true otherwise)
  onChange?:    (value: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOptGroup(o: Option | OptGroup): o is OptGroup {
  return 'group' in o;
}

// Flatten options/groups into a searchable list while preserving group label
interface FlatOption extends Option {
  groupLabel?: string;
}

function flatten(options: Option[] | OptGroup[]): FlatOption[] {
  const out: FlatOption[] = [];
  for (const o of options as any[]) {
    if (isOptGroup(o)) {
      for (const item of o.options) out.push({ ...item, groupLabel: o.group });
    } else {
      out.push(o as FlatOption);
    }
  }
  return out;
}

function filterOptions(flat: FlatOption[], query: string): FlatOption[] {
  if (!query) return flat;
  const q = query.toLowerCase();
  return flat.filter(o =>
    o.label.toLowerCase().includes(q) ||
    (o.groupLabel ?? '').toLowerCase().includes(q)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FormSelect({
  name, label, options, required, disabled, placeholder, hint,
  fieldPerm, clearable, onChange,
}: Props) {
  const { control } = useFormContext();
  if (fieldPerm?.can_view === false) return null;
  const isDisabled = disabled || fieldPerm?.can_edit === false;
  const allowClear = clearable ?? !required;

  const flat = flatten(options);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error     = fieldState.error?.message;
        const hintId    = `${name}-hint`;
        const errorId   = `${name}-error`;
        const selected  = flat.find(o => String(o.value) === String(field.value ?? '')) ?? null;

        return (
          <div className={['form-field fg', error ? 'err' : '', required ? 'req' : ''].filter(Boolean).join(' ')}>
            <label htmlFor={`${name}-input`} className="field-label">
              {label}
              {required && <span className="req-mark" aria-hidden="true">*</span>}
            </label>

            <SearchableSelect
              inputId={`${name}-input`}
              flat={flat}
              options={options}
              selected={selected}
              placeholder={placeholder ?? 'Select…'}
              disabled={isDisabled}
              allowClear={allowClear}
              hasError={!!error}
              aria-describedby={[error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined}
              onSelect={opt => {
                const v = opt ? opt.value : '';
                field.onChange(v);
                field.onBlur();
                onChange?.(String(v));
              }}
              onClear={() => {
                field.onChange('');
                field.onBlur();
                onChange?.('');
              }}
            />

            {hint  && !error && <p id={hintId}  className="field-hint">{hint}</p>}
            {error           && <p id={errorId} className="err" role="alert">{error}</p>}
          </div>
        );
      }}
    />
  );
}

// ─── SearchableSelect (internal, stateful) ─────────────────────────────────────
interface SSProps {
  inputId:    string;
  flat:       FlatOption[];
  options:    Option[] | OptGroup[];
  selected:   FlatOption | null;
  placeholder:string;
  disabled:   boolean;
  allowClear: boolean;
  hasError:   boolean;
  'aria-describedby'?: string;
  onSelect:   (opt: FlatOption | null) => void;
  onClear:    () => void;
}

function SearchableSelect({
  inputId, flat, options, selected, placeholder, disabled,
  allowClear, hasError, onSelect, onClear, ...rest
}: SSProps) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [focused, setFocused] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLUListElement>(null);

  const filtered = filterOptions(flat, query);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focused < 0 || !listRef.current) return;
    const item = listRef.current.querySelectorAll<HTMLLIElement>('[role="option"]')[focused];
    item?.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setFocused(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const selectOpt = useCallback((opt: FlatOption) => {
    if (opt.disabled) return;
    onSelect(opt);
    setOpen(false);
    setQuery('');
    setFocused(-1);
  }, [onSelect]);

  const handleKey = (e: React.KeyboardEvent) => {
    const navigable = filtered.filter(o => !o.disabled);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { openDropdown(); return; }
      setFocused(p => Math.min(p + 1, navigable.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocused(p => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && focused >= 0 && navigable[focused]) selectOpt(navigable[focused]);
      else if (!open) openDropdown();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    } else if (e.key === 'Tab') {
      setOpen(false);
      setQuery('');
    }
  };

  // ── Styles (match existing design system exactly) ──────────────────────────
  const controlStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    gap:            6,
    border:         '1px solid var(--border2)',
    borderRadius:   'var(--r)',
    background:     disabled ? 'var(--surface2)' : 'var(--surface)',
    padding:        '0 8px 0 10px',
    height:         36,
    cursor:         disabled ? 'not-allowed' : 'pointer',
    transition:     'border-color .12s',
    boxShadow:      open ? '0 0 0 2px var(--blue-md)' : 'none',
    position:       'relative',
  };

  const inputStyle: React.CSSProperties = {
    flex:           1,
    border:         'none',
    outline:        'none',
    background:     'transparent',
    fontSize:       13,
    fontFamily:     'var(--font)',
    color:          'var(--ink)',
    cursor:         disabled ? 'not-allowed' : 'text',
    minWidth:       0,
    padding:        0,
  };

  const dropdownStyle: React.CSSProperties = {
    position:       'absolute',
    top:            'calc(100% + 3px)',
    left:           0,
    right:          0,
    zIndex:         300,
    background:     'var(--surface)',
    border:         '1px solid var(--border2)',
    borderRadius:   'var(--r)',
    boxShadow:      'var(--sh2)',
    maxHeight:      240,
    overflowY:      'auto',
    padding:        '4px 0',
  };

  const optionBase: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    padding:        '8px 12px',
    fontSize:       12,
    cursor:         'pointer',
    userSelect:     'none',
    transition:     'background .08s',
  };

  const groupHeaderStyle: React.CSSProperties = {
    padding:        '6px 12px 2px',
    fontSize:       10,
    fontWeight:     700,
    textTransform:  'uppercase',
    letterSpacing:  '0.07em',
    color:          'var(--ink4)',
  };

  // Render the flat filtered list, re-inserting group headers inline
  function renderOptions() {
    if (filtered.length === 0) {
      return (
        <li style={{ ...optionBase, color: 'var(--ink4)', cursor: 'default', justifyContent: 'center' }}>
          No options found
        </li>
      );
    }

    const items: React.ReactNode[] = [];
    let lastGroup: string | undefined = undefined;
    let navIdx = 0; // tracks index among non-disabled items for keyboard focus

    for (const opt of filtered) {
      // Insert group header when group changes
      if (opt.groupLabel !== undefined && opt.groupLabel !== lastGroup) {
        lastGroup = opt.groupLabel;
        items.push(
          <li key={`grp-${opt.groupLabel}`} aria-hidden="true" style={groupHeaderStyle}>
            {opt.groupLabel}
          </li>
        );
      }

      const isSelected  = selected?.value === opt.value;
      const myNavIdx    = opt.disabled ? -1 : navIdx;
      if (!opt.disabled) navIdx++;
      const isFocused   = myNavIdx >= 0 && focused === myNavIdx;

      items.push(
        <li
          key={opt.value}
          role="option"
          aria-selected={isSelected}
          aria-disabled={opt.disabled}
          onMouseDown={e => { e.preventDefault(); if (!opt.disabled) selectOpt(opt); }}
          onMouseEnter={() => !opt.disabled && setFocused(myNavIdx)}
          style={{
            ...optionBase,
            background:  isFocused ? 'var(--blue-lt)' : isSelected ? 'var(--surface2)' : 'transparent',
            color:       opt.disabled ? 'var(--ink4)'
                          : isSelected ? 'var(--blue)'
                          : 'var(--ink2)',
            fontWeight:  isSelected ? 600 : 400,
            opacity:     opt.disabled ? 0.5 : 1,
            cursor:      opt.disabled ? 'not-allowed' : 'pointer',
            paddingLeft: opt.groupLabel ? 20 : 12,
          }}
        >
          {isSelected && <span style={{ marginRight: 6, fontSize: 10, color: 'var(--blue)' }}>✓</span>}
          {opt.label}
        </li>
      );
    }

    return items;
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* ── Control row ── */}
      <div
        style={controlStyle}
        onClick={() => { if (!open) openDropdown(); }}
        onKeyDown={handleKey}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {/* Search input — always present, shows selected label when closed */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${inputId}-list`}
          disabled={disabled}
          style={inputStyle}
          placeholder={open ? 'Search…' : (selected ? '' : placeholder)}
          value={open ? query : (selected?.label ?? '')}
          onFocus={() => { if (!open) openDropdown(); }}
          onChange={e => {
            setQuery(e.target.value);
            setFocused(-1);
            if (!open) setOpen(true);
          }}
          autoComplete="off"
        />

        {/* Clear button */}
        {allowClear && selected && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onClear(); }}
            aria-label="Clear selection"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', fontSize: 14, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
          >
            ✕
          </button>
        )}

        {/* Chevron */}
        <span
          aria-hidden="true"
          style={{
            fontSize:    9,
            color:       'var(--ink4)',
            flexShrink:  0,
            transform:   open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition:  'transform .15s',
            lineHeight:  1,
          }}
        >
          ▼
        </span>
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <ul
          ref={listRef}
          id={`${inputId}-list`}
          role="listbox"
          style={dropdownStyle}
        >
          {renderOptions()}
        </ul>
      )}
    </div>
  );
}