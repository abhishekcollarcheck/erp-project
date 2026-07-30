import React, { useMemo } from 'react';
import type { ResolvedField } from '../types/form.types';
import type { FieldValue } from '../types/form.types';

export interface SmartFieldRendererProps {
  // Existing props
  field: ResolvedField;
  value: FieldValue;
  onChange?: (value: FieldValue) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;

  // NEW: Add visibility props
  isVisible?: boolean;          // Should this field be shown?
  isDisabled?: boolean;         // Should this field be disabled?
  isRequired?: boolean;         // Should field be marked required?
  isDirty?: boolean;            // Has field been modified?

  // Existing props continued
  className?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// STEP 2: UPDATE COMPONENT
// ============================================================================

export const SmartFieldRenderer: React.FC<SmartFieldRendererProps> = ({
  field,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  
  // NEW: Destructure visibility props with defaults
  isVisible = true,
  isDisabled = false,
  isRequired = field.is_required,
  isDirty = false,
  
  className,
  style,
}) => {
  // ─── NEW: Return null if field not visible ───
  // This is the KEY change - don't render if not visible
  if (!isVisible) {
    return null;
  }

  // ─── Existing: Render based on field type ───
  const renderField = () => {
    switch (field.field_type) {
      // ──────────────────────────────────────────────────────────
      // TEXT INPUTS
      // ──────────────────────────────────────────────────────────
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            type={field.field_type}
            value={value as string || ''}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={isRequired}
            className={className}
            style={style}
          />
        );

      case 'password':
        return (
          <input
            type="password"
            value={value as string || ''}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={isRequired}
            className={className}
            style={style}
          />
        );

      // ──────────────────────────────────────────────────────────
      // NUMBER INPUTS
      // ──────────────────────────────────────────────────────────
      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <input
            type="number"
            // value={value || ''}
            onChange={(e) => onChange?.(e.target.value ? parseFloat(e.target.value) : null)}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={isRequired}
            min={field.min_value}
            max={field.max_value}
            className={className}
            style={style}
          />
        );

      // ──────────────────────────────────────────────────────────
      // DATE INPUTS
      // ──────────────────────────────────────────────────────────
      case 'date':
      case 'datetime':
        return (
          <input
            type={field.field_type}
            value={value as string || ''}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={isDisabled}
            required={isRequired}
            className={className}
            style={style}
          />
        );

      // ──────────────────────────────────────────────────────────
      // TEXTAREA
      // ──────────────────────────────────────────────────────────
      case 'textarea':
        return (
          <textarea
            value={value as string || ''}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={field.placeholder}
            disabled={isDisabled}
            required={isRequired}
            className={className}
            style={style}
          />
        );

      // ──────────────────────────────────────────────────────────
      // SELECT (DROPDOWN)
      // ──────────────────────────────────────────────────────────
      case 'select':
        return (
          <select
            value={value as string || ''}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={isDisabled}
            required={isRequired}
            className={className}
            style={style}
          >
            <option value="">-- Select {field.label} --</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      // ──────────────────────────────────────────────────────────
      // MULTI-SELECT
      // ──────────────────────────────────────────────────────────
      case 'multi_select':
        return (
          <select
            multiple
            value={(value as string[]) || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
              onChange?.(selected);
            }}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={isDisabled}
            required={isRequired}
            className={className}
            style={style}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      // ──────────────────────────────────────────────────────────
      // RADIO BUTTONS
      // ──────────────────────────────────────────────────────────
      case 'radio':
        return (
          <fieldset disabled={isDisabled} className={className}>
            {field.options?.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name={field.field_key}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  required={isRequired}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        );

      // ──────────────────────────────────────────────────────────
      // CHECKBOX
      // ──────────────────────────────────────────────────────────
      case 'checkbox':
        return (
          <fieldset disabled={isDisabled} className={className}>
            {field.options?.map((option) => (
              <label key={option.value}>
                <input
                  type="checkbox"
                  name={field.field_key}
                  value={option.value}
                  checked={(value as string[])?.includes(String(option.value)) || false}
                  onChange={(e) => {
                    const current = (value as string[]) || [];
                    if (e.target.checked) {
                      onChange?.([...current, String(option.value)]);
                    } else {
                      onChange?.(current.filter(v => v !== String(option.value)));
                    }
                  }}
                  onBlur={onBlur}
                  onFocus={onFocus}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        );

      // ──────────────────────────────────────────────────────────
      // DEFAULT: Unsupported field type
      // ──────────────────────────────────────────────────────────
      default:
        console.warn(`Unsupported field type: ${field.field_type}`);
        return null;
    }
  };

  // ─── Render field with label and error ───
  return (
    <div className={`field-wrapper ${isDirty ? 'dirty' : ''} ${error ? 'error' : ''}`}>
      {/* LABEL */}
      <label htmlFor={field.field_key} className="field-label">
        {field.label}
        {isRequired && <span className="required-indicator">*</span>}
      </label>

      {/* HELP TEXT */}
      {field.help_text && <div className="field-help">{field.help_text}</div>}

      {/* FIELD */}
      <div className="field-input">{renderField()}</div>

      {/* ERROR MESSAGE */}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
};

export default SmartFieldRenderer;

// ============================================================================
// USAGE IN PARENT COMPONENT
// ============================================================================

// Before (without visibility):
// <SmartFieldRenderer
//   field={field}
//   value={values[field.field_key]}
//   onChange={(v) => setFieldValue(field.field_key, v)}
// />

// After (with visibility):
// <SmartFieldRenderer
//   field={field}
//   value={values[field.field_key]}
//   onChange={(v) => setFieldValue(field.field_key, v)}
//   isVisible={isFieldVisible(field.field_key)}     // NEW
//   isRequired={visibility[field.field_key]?.required}  // NEW
//   isDisabled={visibility[field.field_key]?.disabled}  // NEW
//   isDirty={dirtyFields.has(field.field_key)}     // NEW
//   error={errors[field.field_key]}
// />