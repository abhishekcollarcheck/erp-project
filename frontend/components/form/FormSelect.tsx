'use client';

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
  can_copy?: boolean;
  is_masked?: boolean;
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
  clearable?:   boolean;  
  blockContextMenu?: boolean;
  onChange?:    (value: string) => void;
  /** Fired on a blocked copy/cut/drag attempt. Useful for audit logging. */
  onCopyBlocked?: (name: string) => void;
}

const MASK = '••••••••';

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
  fieldPerm, clearable, blockContextMenu = true, onChange, onCopyBlocked,
}: Props) {
  const { control } = useFormContext();

  // Transient "copying is disabled" notice — hooks must run before any early return.
  const [copyBlocked, setCopyBlocked] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const flagBlocked = useCallback(() => {
    onCopyBlocked?.(name);
    setCopyBlocked(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setCopyBlocked(false), 2000);
  }, [name, onCopyBlocked]);

  // Field-level visibility gate
  if (fieldPerm?.can_view === false) return null;

  const isMasked   = fieldPerm?.is_masked === true;
  // A masked selection must never reach the clipboard, whatever can_copy says.
  const noCopy     = fieldPerm?.can_copy === false || isMasked;
  const isDisabled = disabled === true;
  // Locked = cannot change the value. Unlike `disabled`, the control stays
  // focusable and selectable so a user with copy rights can still read/copy it.
  const isLocked   = isDisabled || fieldPerm?.can_edit === false || isMasked;
  const allowClear = (clearable ?? !required) && !isLocked;

  const flat = flatten(options);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error     = fieldState.error?.message;
        const hintId    = `${name}-hint`;
        const errorId   = `${name}-error`;
        const noticeId  = `${name}-copy-notice`;
        const selected  = flat.find(o => String(o.value) === String(field.value ?? '')) ?? null;
        return (
          <div className={['form-field fg', error ? 'err' : '', required ? 'req' : ''].filter(Boolean).join(' ')}>
            <label htmlFor={`${name}-input`} className="field-label">
              {label}
              {required && <span className="req-mark" aria-hidden="true">*</span>}
              {isMasked && (
                <span
                  style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}
                  title="This field is masked based on your role"
                >🔒</span>
              )}
              {noCopy && !isMasked && (
                <span
                  style={{ fontSize: 10, color: 'var(--ink4)', marginLeft: 4 }}
                  title="Copying is disabled for this field"
                  aria-hidden="true"
                >⊘</span>
              )}
            </label>

            <SearchableSelect
              inputId={`${name}-input`}
              flat={flat}
              options={options}
              selected={selected}
              placeholder={placeholder ?? 'Select…'}
              disabled={isDisabled}
              locked={isLocked}
              masked={isMasked}
              noCopy={noCopy}
              blockContextMenu={blockContextMenu}
              onCopyBlocked={flagBlocked}
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
            {copyBlocked && (
              <p id={noticeId} className="field-hint" role="status" aria-live="polite">
                Copying is disabled for this field.
              </p>
            )}
            {error && <p id={errorId} className="err" role="alert">{error}</p>}
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
  locked:     boolean;
  masked:     boolean;
  noCopy:     boolean;
  blockContextMenu: boolean;
  onCopyBlocked: () => void;
  allowClear: boolean;
  hasError:   boolean;
  'aria-describedby'?: string;
  onSelect:   (opt: FlatOption | null) => void;
  onClear:    () => void;
}

function SearchableSelect({
  inputId, flat, options, selected, placeholder, disabled, locked, masked,
  noCopy, blockContextMenu, onCopyBlocked,
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

  // A locked field must never be left open (e.g. permissions arriving late)
  useEffect(() => {
    if (locked && open) { setOpen(false); setQuery(''); setFocused(-1); }
  }, [locked, open]);

  // Scroll focused item into view
  useEffect(() => {
    if (focused < 0 || !listRef.current) return;
    const item = listRef.current.querySelectorAll<HTMLLIElement>('[role="option"]')[focused];
    item?.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  const openDropdown = useCallback(() => {
    if (disabled || locked) return;
    setOpen(true);
    setQuery('');
    setFocused(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled, locked]);

  const selectOpt = useCallback((opt: FlatOption) => {
    if (opt.disabled || locked) return;
    onSelect(opt);
    setOpen(false);
    setQuery('');
    setFocused(-1);
  }, [onSelect, locked]);

  // ── Copy guards ────────────────────────────────────────────────────────────
  // The query the user typed themselves is their own text — only the selected
  // label (shown when closed) and the option list are restricted.
  const guardActive = noCopy && !open;

  const handleClipboard = useCallback((e: React.ClipboardEvent) => {
    if (!noCopy) return;
    e.preventDefault();
    e.clipboardData?.setData('text/plain', '');
    onCopyBlocked();
  }, [noCopy, onCopyBlocked]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!noCopy) return;
    e.preventDefault();
    onCopyBlocked();
  }, [noCopy, onCopyBlocked]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!noCopy || !blockContextMenu) return;
    e.preventDefault();
    onCopyBlocked();
  }, [noCopy, blockContextMenu, onCopyBlocked]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (locked) return;
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

  // What the closed control displays. Masked fields never put the real label
  // in the DOM at all.
  const displayLabel = masked
    ? (selected ? MASK : '')
    : (selected?.label ?? '');

  // ── Styles (match existing design system exactly) ──────────────────────────
  const controlStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    gap:            6,
    border:         '1px solid var(--border2)',
    borderRadius:   'var(--r)',
    background:     (disabled || locked) ? 'var(--surface2)' : 'var(--surface)',
    padding:        '0 8px 0 10px',
    height:         36,
    cursor:         disabled ? 'not-allowed' : locked ? 'default' : 'pointer',
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
    cursor:         disabled ? 'not-allowed' : locked ? 'default' : 'text',
    minWidth:       0,
    padding:        0,
    // Suppress selection only while the control shows a restricted value.
    // While open the field holds the user's own query, so selection stays on.
    ...(guardActive ? { userSelect: 'none' as const, WebkitUserSelect: 'none' as const } : {}),
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
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
      data-nocopy={noCopy || undefined}
      onCopy={noCopy ? handleClipboard : undefined}
      onCut={noCopy ? handleClipboard : undefined}
      onDragStart={noCopy ? handleDragStart : undefined}
      onContextMenu={noCopy && blockContextMenu ? handleContextMenu : undefined}
    >
      {/* ── Control row ── */}
      <div
        style={controlStyle}
        onClick={() => { if (!open && !locked) openDropdown(); }}
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
          aria-readonly={locked || undefined}
          disabled={disabled}
          readOnly={locked}
          style={inputStyle}
          placeholder={open ? 'Search…' : (selected ? '' : placeholder)}
          value={open ? query : displayLabel}
          onFocus={() => { if (!open && !locked) openDropdown(); }}
          onChange={e => {
            if (locked) return;
            setQuery(e.target.value);
            setFocused(-1);
            if (!open) setOpen(true);
          }}
          autoComplete="off"
        />

        {/* Clear button */}
        {allowClear && selected && !disabled && !locked && (
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
        {!locked && (
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
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && !locked && (
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