'use client';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  name:           string;
  label:          string;
  required?:      boolean;
  disabled?:      boolean;
  hint?:          string;
  defaultCountry?: string;   // e.g. '+91'
  fieldPerm?:     { can_view?: boolean; can_edit?: boolean };
}

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1',  label: '🇺🇸 +1'  },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971',label: '🇦🇪 +971'},
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+60', label: '🇲🇾 +60' },
  { code: '+61', label: '🇦🇺 +61' },
];

export function FormPhoneInput({
  name, label, required, disabled, hint, defaultCountry = '+91', fieldPerm,
}: Props) {
  const { control, formState: { errors } } = useFormContext();
  const error      = (errors as any)[name]?.message as string | undefined;
  if (fieldPerm?.can_view === false) return null;
  const isDisabled = disabled || fieldPerm?.can_edit === false;

  return (
    <Controller name={name} control={control} render={({ field }) => {
      // Parse stored value into prefix + number
      const stored = String(field.value ?? '');
      const matched = COUNTRY_CODES.find(c => stored.startsWith(c.code));
      const prefix = matched?.code ?? defaultCountry;
      const number = matched ? stored.slice(prefix.length).trim() : stored.replace(/^\+\d{1,3}\s?/, '');

      const update = (newPrefix: string, newNumber: string) => {
        field.onChange(newNumber ? `${newPrefix} ${newNumber.replace(/\D/g, '')}` : '');
      };

      return (
        <div className={`form-field${error ? ' err' : ''}${required ? ' req' : ''}`}>
          <label className="field-label">
            {label}
            {required && <span className="req-mark">*</span>}
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Country prefix */}
            <select
              value={prefix}
              disabled={isDisabled}
              onChange={e => update(e.target.value, number)}
              style={{
                background:   'var(--surface2)',
                border:       '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding:      '0 8px',
                fontSize:     12,
                color:        'var(--ink2)',
                cursor:       isDisabled ? 'not-allowed' : 'pointer',
                flexShrink:   0,
                height:       36,
              }}
            >
              {COUNTRY_CODES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>

            {/* Number input */}
            <input
              type="tel"
              value={number}
              disabled={isDisabled}
              placeholder="9876543210"
              maxLength={15}
              aria-invalid={!!error}
              className="form-input"
              style={{ flex: 1 }}
              onChange={e => update(prefix, e.target.value)}
            />
          </div>
          {hint && !error && <p className="field-hint">{hint}</p>}
          {error && <p className="field-error" role="alert">{error}</p>}
        </div>
      );
    }} />
  );
}
