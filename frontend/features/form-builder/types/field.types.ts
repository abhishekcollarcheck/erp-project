import type { DependencyRule } from './dependency.types';

export const FIELD_TYPES = [
  'text',
  'email',
  'number',
  'password',
  'textarea',
  'select',
  'multi_select',
  'radio',
  'checkbox',
  'date',
  'datetime',
  'file',
  'image',
  'phone',
  'url',
  'currency',
  'percentage',
] as const;

export type FieldType = typeof FIELD_TYPES[number];

export type FieldValue = 
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Date
  | null
  | undefined;

export interface FieldValueAttributes {
  value: FieldValue;
  originalValue?: FieldValue;
  isDirty?: boolean;
  isTouched?: boolean;
}

export interface FieldValidationState {
  isValid: boolean;
  error?: string;
  errorCode?: string;
  errors?: string[];
  failedValidators?: string[];
  lastValidatedAt?: Date;
  isValidating?: boolean;
}

export interface FieldRenderConfig {
  width?: number; // 25, 33, 50, 66, 75, 100
  columnSpan?: number; // 1, 2, 3, 4 (CSS grid columns)
  className?: string;
  style?: Record<string, string>;
  placeholder?: string;
  helpText?: string;
  showError?: boolean;
  errorPosition?: 'top' | 'bottom' | 'right';
  showRequiredIndicator?: boolean;
  labelClassName?: string;
  labelPosition?: 'top' | 'left' | 'right';
}

export interface FieldConstraints {
  required?: boolean;
  requiredMessage?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp | string; // For text validation
  min?: number;
  max?: number;
  step?: number;
  unique?: boolean;
  uniqueMessage?: string;
  custom?: (value: FieldValue) => boolean | string | Promise<boolean | string>;
  customMessage?: string;
  matchField?: string;
  matchMessage?: string;
}

export interface FieldState {
  id: number;
  fieldKey: string;
  value: FieldValue;
  previousValue?: FieldValue;
  isDirty: boolean;
  touched: boolean;
  isVisible: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  validation: FieldValidationState;
  isFocused: boolean;
  isLoading: boolean;
  metadata?: Record<string, unknown>;
}

export interface DynamicFieldProperties {
  isRequired?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isVisible?: boolean;
  placeholder?: string;
  helpText?: string;
  value?: FieldValue;
  options?: Array<{label: string; value: any}>;
  constraints?: Partial<FieldConstraints>;
}

export interface FieldEventHandlers {
  onChange?: (value: FieldValue, fieldKey: string) => void;
  onFocus?: (fieldKey: string) => void;
  onBlur?: (fieldKey: string) => void;
  onValidate?: (isValid: boolean, errors?: string[], fieldKey?: string) => void;
  onVisibilityChange?: (isVisible: boolean, fieldKey: string) => void;
  onDisabledChange?: (isDisabled: boolean, fieldKey: string) => void;
}

export interface FieldOptionItem {
  label: string;
  value: string | number | boolean;
  isDefault?: boolean;
  isDisabled?: boolean;
  icon?: string;
  color?: string;
  group?: string; // For grouped options
  meta?: Record<string, unknown>;
  children?: FieldOptionItem[];
}

export interface SelectFieldConfig {
  options: FieldOptionItem[];
  isMulti?: boolean;
  isCreatable?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  optionRenderer?: (option: FieldOptionItem) => React.ReactNode;
  valueRenderer?: (value: FieldValue) => React.ReactNode;
}

export interface DateFieldConfig {
  format?: string; // e.g., 'YYYY-MM-DD', 'DD/MM/YYYY'
  minDate?: Date | string;
  maxDate?: Date | string;
  disabledDates?: (Date | string)[];
  showTime?: boolean;
  timeFormat?: string;
  timezone?: string;  
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 1=Monday, etc.
}

export interface FileFieldConfig {
  accept?: string[]; // e.g., ['.pdf', '.docx']
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  showPreview?: boolean;
  previewHeight?: number;
  uploadEndpoint?: string;
  uploadHandler?: (file: File) => Promise<{url: string; id: string}>;
}

export interface FieldMetadata {
  section?: string;
  sortOrder?: number;
  columnWidth?: number;
  isSummary?: boolean;
  tooltip?: string;  
  icon?: string;
  colorScheme?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';  
  customAttributes?: Record<string, unknown>;
}

export interface FieldConfig {
  id: number;
  fieldKey: string;
  label: string;  
  fieldType: FieldType;
  constraints?: FieldConstraints;
  renderConfig?: FieldRenderConfig;
  selectConfig?: SelectFieldConfig;
  dateConfig?: DateFieldConfig;
  fileConfig?: FileFieldConfig;
  dependencies?: DependencyRule[];
  defaultValue?: FieldValue;
  metadata?: FieldMetadata;
  handlers?: FieldEventHandlers;
}

export interface FieldRendererProps {
  field: FieldConfig;  
  state: FieldState;
  value: FieldValue;
  error?: string;
  isVisible: boolean;
  onChange: (value: FieldValue) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  style?: Record<string, string>;
}

export namespace FieldTemplates {
  export const Text = {
    fieldType: 'text' as FieldType,
    constraints: { minLength: 0, maxLength: 255 },
  };
  
  export const Email = {
    fieldType: 'email' as FieldType,
    constraints: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  };
  
  export const Password = {
    fieldType: 'password' as FieldType,
    constraints: { minLength: 8 },
  };
  
  export const Phone = {
    fieldType: 'phone' as FieldType,
    constraints: { pattern: /^[\d\s\-\+\(\)]+$/, minLength: 10 },
  };
  
  export const Currency = {
    fieldType: 'currency' as FieldType,
    constraints: { min: 0, step: 0.01 },
  };
  
  export const Date = {
    fieldType: 'date' as FieldType,
    dateConfig: { format: 'YYYY-MM-DD' },
  };
  
  export const SingleSelect = {
    fieldType: 'select' as FieldType,
    selectConfig: { isMulti: false, isSearchable: true },
  };
  
  export const MultiSelect = {
    fieldType: 'multi_select' as FieldType,
    selectConfig: { isMulti: true, isSearchable: true },
  };
}

export function isValidFieldValue(fieldType: FieldType, value: FieldValue): boolean {
  if (value === null || value === undefined) return true; // Allow null/undefined
  
  switch (fieldType) {
    case 'text':
    case 'email':
    case 'password':
    case 'textarea':
    case 'url':
    case 'phone':
      return typeof value === 'string';
    
    case 'number':
    case 'currency':
    case 'percentage':
      return typeof value === 'number';
    
    case 'date':
    case 'datetime':
      return value instanceof Date || typeof value === 'string';
    
    case 'select':
    case 'radio':
      return typeof value === 'string' || typeof value === 'number';
    
    case 'multi_select':
    case 'checkbox':
      return Array.isArray(value);
    
    case 'file':
    case 'image':
      return value instanceof File || typeof value === 'string';
    
    default:
      return true;
  }
}

export function isFieldVisible(fieldState: FieldState): boolean {
  return fieldState.isVisible && !fieldState.isReadOnly;
}

export function isFieldEditable(fieldState: FieldState): boolean {
  return fieldState.isVisible && !fieldState.isDisabled && !fieldState.isReadOnly;
}

export default {
  type: 'FieldTypes',
  version: '1.0.0',
  templates: FieldTemplates,
} as const;