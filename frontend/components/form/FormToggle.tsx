'use client';
/**
 * FormToggle.tsx
 * Slide toggle for boolean fields (Yes/No, Active/Inactive, etc.).
 * ─ RHF Controller-wrapped
 * ─ Keyboard accessible: Space/Enter toggles
 * ─ Shows optional on/off labels beside toggle
 * ─ onChange side-effect for conditional field show/hide
 */

import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  name:       string;
  label:      string;
  onLabel?:   string;   // default 'Yes'
  offLabel?:  string;   // default 'No'
  hint?:      string;
  disabled?:  boolean;
  showValue?: boolean;  // show Yes/No label beside toggle
  onChange?:  (value: boolean) => void;
}

export function FormToggle({
  name, label, onLabel = 'Yes', offLabel = 'No',
  hint, disabled, showValue = false, onChange,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error = (errors as any)[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const checked = !!field.value;

        const toggle = () => {
          if (disabled) return;
          field.onChange(!checked);
          onChange?.(!checked);
        };

        return (
          <div className="form-field">
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        10,
                cursor:     disabled ? 'not-allowed' : 'pointer',
                userSelect: 'none',
              }}
              onClick={toggle}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggle();
                }
              }}
              role="switch"
              aria-checked={checked}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
            >
              {/* Track */}
              <div
                style={{
                  width:        40,
                  height:       22,
                  borderRadius: 99,
                  flexShrink:   0,
                  position:     'relative',
                  transition:   'background .2s',
                  background:   checked
                    ? disabled ? 'var(--blue-md)' : 'var(--blue)'
                    : 'var(--border2)',
                  opacity:      disabled ? 0.6 : 1,
                }}
              >
                {/* Thumb */}
                <div
                  style={{
                    position:     'absolute',
                    top:          3,
                    left:         checked ? 21 : 3,
                    width:        16,
                    height:       16,
                    borderRadius: '50%',
                    background:   '#fff',
                    boxShadow:    '0 1px 3px rgba(0,0,0,.2)',
                    transition:   'left .2s',
                  }}
                />
              </div>

              {/* Label */}
              <span style={{
                fontSize:   13,
                fontWeight: 500,
                color:      disabled ? 'var(--ink4)' : 'var(--ink2)',
              }}>
                {label}
              </span>

              {/* Yes/No value indicator */}
              {showValue && (
                <span style={{
                  fontSize:     11,
                  fontWeight:   600,
                  color:        checked ? 'var(--green)' : 'var(--ink4)',
                  marginLeft:   2,
                }}>
                  {checked ? onLabel : offLabel}
                </span>
              )}
            </div>

            {hint && !error && <p className="field-hint">{hint}</p>}
            {error          && <p className="field-error" role="alert">{error}</p>}
          </div>
        );
      }}
    />
  );
}
