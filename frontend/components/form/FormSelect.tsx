'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext, Controller }               from 'react-hook-form';
import { Dropdown }                                  from 'primereact/dropdown';
import type { FieldPerm }                            from './maskField';
import { maskPartial }                               from '../../utils/validationEngine';

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

const hasGroups = (options: Option[] | OptGroup[]) =>
  (options as any[]).some(isOptGroup);

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

  const isFullMask    = fieldPerm?.is_masked === true;
  const isPartialMask = !isFullMask && fieldPerm?.is_partial_masked === true;
  const isMasked   = isFullMask || isPartialMask;
  // A masked selection must never reach the clipboard, whatever can_copy says.
  const noCopy     = fieldPerm?.can_copy === false || isMasked;
  const isDisabled = disabled === true;
  // Locked = cannot change the value (permission or masking).
  const isLocked   = isDisabled || fieldPerm?.can_edit === false || isMasked;
  const allowClear = (clearable ?? !required) && !isLocked;

  const flat    = flatten(options);
  const grouped = hasGroups(options);

  // Options shaped for PrimeReact. When grouped we pass OptGroup[] straight
  // through with optionGroupLabel/optionGroupChildren; otherwise the flat list.
  const pOptions = grouped ? (options as OptGroup[]) : flat;

  // Copy-guard handlers for the wrapper — only the resolved label / option list
  // is protected; text the user types into the filter is their own.
  const handleClipboard = (e: React.ClipboardEvent) => {
    if (!noCopy) return;
    e.preventDefault();
    e.clipboardData?.setData('text/plain', '');
    flagBlocked();
  };
  const handleDragStart = (e: React.DragEvent) => {
    if (!noCopy) return;
    e.preventDefault();
    flagBlocked();
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!noCopy || !blockContextMenu) return;
    e.preventDefault();
    flagBlocked();
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const error    = fieldState.error?.message;
        const hintId   = `${name}-hint`;
        const errorId  = `${name}-error`;
        const noticeId = `${name}-copy-notice`;
        const selected = flat.find(o => String(o.value) === String(field.value ?? '')) ?? null;

        return (
          <div
            className={['form-field fg', error ? 'err' : '', required ? 'req' : ''].filter(Boolean).join(' ')}
            data-nocopy={noCopy || undefined}
            onCopy={noCopy ? handleClipboard : undefined}
            onCut={noCopy ? handleClipboard : undefined}
            onDragStart={noCopy ? handleDragStart : undefined}
            onContextMenu={noCopy && blockContextMenu ? handleContextMenu : undefined}
          >
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

            {isLocked ? (
              // Locked / masked: render a static control-styled value — no listbox
              // is ever mounted, so a restricted label can't be opened or navigated.
              <div
                id={`${name}-input`}
                aria-readonly="true"
                style={{
                  display: 'flex', alignItems: 'center', minHeight: 38,
                  border: '1px solid var(--border2)', borderRadius: 'var(--r)',
                  background: 'var(--surface2)', padding: '0 10px',
                  fontSize: 13, color: selected ? 'var(--ink)' : 'var(--ink4)',
                  ...(noCopy ? { userSelect: 'none' as const, WebkitUserSelect: 'none' as const } : {}),
                }}
              >
                {isFullMask
                  ? (selected ? MASK : (placeholder ?? 'Select…'))
                  : isPartialMask
                    ? (selected ? maskPartial(selected.label) : (placeholder ?? 'Select…'))
                    : (selected?.label ?? (placeholder ?? 'Select…'))}
              </div>
            ) : (
              <Dropdown
                inputId={`${name}-input`}
                value={field.value ?? ''}
                options={pOptions as any}
                optionLabel="label"
                optionValue="value"
                optionDisabled="disabled"
                {...(grouped
                  ? { optionGroupLabel: 'group', optionGroupChildren: 'options' }
                  : {})}
                placeholder={placeholder ?? 'Select…'}
                filter
                showClear={allowClear && !!field.value}
                disabled={isDisabled}
                className="w-full"
                style={{ width: '100%' }}
                aria-describedby={[error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined}
                onChange={(e) => {
                  const v = e.value ?? '';
                  field.onChange(v);
                  field.onBlur();
                  onChange?.(String(v));
                }}
                onBlur={field.onBlur}
              />
            )}

            {hint  && !error && <p id={hintId} className="field-hint">{hint}</p>}
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
