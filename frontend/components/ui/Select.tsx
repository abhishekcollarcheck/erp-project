'use client';
import { Dropdown } from 'primereact/dropdown';
import type { CSSProperties } from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface SelectProps {
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  filter?: boolean;
  showClear?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  /** Rendered as the first, empty option (e.g. "All Departments"). */
  allLabel?: string;
}

/**
 * Standalone (non-form) dropdown used for filter bars, sort selectors and any
 * ad-hoc `<select>` outside react-hook-form. Wraps PrimeReact <Dropdown> and is
 * skinned by styles/primereact-overrides.css. This is the single standalone
 * dropdown primitive for the app — do not fork per-page variants.
 */
export function Select({
  value, onChange, options, placeholder, disabled,
  filter, showClear, className, style, ariaLabel, allLabel,
}: SelectProps) {
  const opts: SelectOption[] = allLabel
    ? [{ label: allLabel, value: '' }, ...options]
    : options;

  return (
    <Dropdown
      value={value ?? ''}
      onChange={(e) => onChange(e.value)}
      options={opts}
      optionLabel="label"
      optionValue="value"
      placeholder={placeholder}
      disabled={disabled}
      filter={filter}
      showClear={showClear && !!value}
      className={className}
      style={style}
      aria-label={ariaLabel}
    />
  );
}
