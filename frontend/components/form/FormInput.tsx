'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

interface FieldPerm {
  can_view?: boolean;
  can_edit?: boolean;
  can_copy?: boolean;
  is_masked?: boolean;
}

interface Props {
  name:         string;
  label:        string;
  type?:        'text' | 'email' | 'number' | 'password' | 'tel' | 'url' | 'search';
  placeholder?: string;
  prefilledValue? : string | number;
  displayValue?:string;
  required?:    boolean;
  disabled?:    boolean;
  readOnly?:    boolean;
  hint?:        string;
  maxLength?:   number;
  min?:         string | number;
  max?:         string | number;
  step?:        string | number;
  prefix?:      React.ReactNode;   // e.g. "₹" or an icon
  suffix?:      React.ReactNode;   // e.g. "%" or an icon
  autoComplete?:string;
  fieldPerm?:   FieldPerm;
  /** Suppress the right-click menu when copying is blocked. Default: true. */
  blockContextMenu?: boolean;
  onChange?:    (value: string) => void;
  onBlur?:      () => void;
  /** Fired whenever the user attempts a blocked copy/cut/drag. Useful for audit logging. */
  onCopyBlocked?: (name: string) => void;
}

export function FormInput({
  name, label, type = 'text', placeholder, prefilledValue, displayValue, required, disabled, readOnly,
  hint, maxLength, min, max, step, prefix, suffix, autoComplete,
  fieldPerm, blockContextMenu = true, onChange, onBlur, onCopyBlocked,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  // Transient "copying is disabled" notice.
  const [copyBlocked, setCopyBlocked] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const isMasked   = fieldPerm?.is_masked === true;
  // A masked value must never reach the clipboard, whatever can_copy says.
  const noCopy     = fieldPerm?.can_copy === false || isMasked;

  const flagBlocked = useCallback(() => {
    onCopyBlocked?.(name);
    setCopyBlocked(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setCopyBlocked(false), 2000);
  }, [name, onCopyBlocked]);

  const handleClipboard = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Belt and braces: preventDefault already cancels the write, this clears
    // any payload a browser may have staged.
    e.clipboardData?.setData('text/plain', '');
    flagBlocked();
  }, [flagBlocked]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLInputElement>) => {
    e.preventDefault();
    flagBlocked();
  }, [flagBlocked]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    flagBlocked();
  }, [flagBlocked]);

  // Field-level visibility gate
  if (fieldPerm?.can_view === false) return null;

  const isReadOnly   = readOnly || fieldPerm?.can_edit === false;
  const isDisabled   = disabled;
  const displayType  = isMasked ? 'password' : type;
  const hintId       = `${name}-hint`;
  const errorId      = `${name}-error`;
  const noticeId     = `${name}-copy-notice`;
  const describedBy  = [error ? errorId : '', hint && !error ? hintId : ''].filter(Boolean).join(' ') || undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={[
          'form-field',
          error    ? 'err' : '',
          required ? 'req' : '',
        ].filter(Boolean).join(' ')}>
          <div className='fg'>
          <label htmlFor={name} className="field-label">
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

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Prefix */}
            {prefix && (
              <span style={{
                position:    'absolute',
                left:        10,
                color:       'var(--ink3)',
                fontSize:    13,
                pointerEvents: 'none',
                userSelect:  'none',
                zIndex:      1,
              }}>
                {prefix}
              </span>
            )}

            <input
              {...field}
              id={name}
              type={displayType}
              placeholder={placeholder}
              disabled={isDisabled}
              readOnly={isReadOnly || !!prefilledValue}
              maxLength={maxLength}
              min={min}
              max={max}
              step={step}
              autoComplete={autoComplete}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              aria-required={required}
              data-nocopy={noCopy || undefined}
              value={displayValue ?? field.value ?? ''}
              className={[
                'form-input',
                isReadOnly ? 'readonly' : '',
                isMasked ? 'masked' : '',
                noCopy ? 'nocopy' : '',
              ].filter(Boolean).join(' ')}
              style={{
                paddingLeft:  prefix ? 28 : undefined,
                paddingRight: suffix ? 28 : undefined,
                flex: '1 1 0%',
                // Selection is only suppressed when the field is also non-editable —
                // killing it on an editable field would break select-all-to-replace.
                ...(noCopy && (isReadOnly || !!prefilledValue)
                  ? { userSelect: 'none' as const, WebkitUserSelect: 'none' as const }
                  : {}),
              }}
              onCopy={noCopy ? handleClipboard : undefined}
              onCut={noCopy ? handleClipboard : undefined}
              onDragStart={noCopy ? handleDragStart : undefined}
              onContextMenu={noCopy && blockContextMenu ? handleContextMenu : undefined}
              onChange={e => {
                if (isReadOnly || prefilledValue) return;
                field.onChange(e.target.value);
                onChange?.(e.target.value);
              }}
              onBlur={() => {
                field.onBlur();
                onBlur?.();
              }}
            />

            {/* Suffix */}
            {suffix && (
              <span style={{
                position:    'absolute',
                right:       10,
                color:       'var(--ink3)',
                fontSize:    13,
                pointerEvents: 'none',
                userSelect:  'none',
              }}>
                {suffix}
              </span>
            )}
          </div>

          {/* {hint && !error && (
            <p id={hintId} className="field-hint">{hint}</p>
          )} */}
          {copyBlocked && (
            <p id={noticeId} className="field-hint" role="status" aria-live="polite">
              Copying is disabled for this field.
            </p>
          )}
          {error && (
            <p id={errorId} className="err" role="alert">{error}</p>
          )}
          </div>
        </div>
      )}
    />
  );
}