import { VisibilityMap, DependencyRule } from "./dependency.types";
export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'file'
  | 'image'
  | 'phone'
  | 'url'
  | 'currency'
  | 'percentage';

export type FieldValue = string | number | boolean | string[] | null | undefined;

export type DynamicSource =
  | 'departments'
  | 'designations'
  | 'employees'
  | 'roles'
  | 'leave_types'
  | 'asset_categories'
  | 'custom';

export interface ResolvedPermissions {
  can_view: boolean;
  can_edit: boolean;
  can_copy: boolean;
  can_download: boolean;
  is_masked: boolean;
}

export interface FieldOption {
  label: string;
  value: string | number;
  meta?: Record<string, unknown>;
}

export interface ResolvedField {
  id: number;
  field_key: string;
  label: string;  
  field_type: FieldType;
  section?: string;
  placeholder?: string;
  help_text?: string;
  width?: number;
  column_span?: number;
  is_required: boolean;
  is_readonly: boolean;
  is_hidden?: boolean;
  sort_order: number;
  
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  regex_pattern?: string;
  custom_validation?: string;
  dynamic_source?: DynamicSource;
  dynamic_source_label?: string;
  dynamic_source_value?: string;
  dynamic_source_filter?: string;
  options?: FieldOption[];
  default_value?: FieldValue;
  resolved: ResolvedPermissions;
  dependencies?: Array<any>;
}

export interface Section {
  name: string;
  fieldIds: number[];
  sort_order: number;
}

export interface FormDefinition {
  id: number;
  name: string;
  description?: string;
  fields: ResolvedField[];
  sections?: Section[];
}

export interface FieldState {
  value: FieldValue;
  error?: string;
  isDirty: boolean; // Has user changed this field?
  touched: boolean; // Has user interacted with this field?
  isVisible: boolean; // Should this field be shown? (NEW for Phase 1)
  isDisabled: boolean; // Should this field be disabled?
  isRequired: boolean; // Is this field required? (can change based on dependencies)
}

export interface FormState {
  values: Record<string, FieldValue>;
  errors: Record<string, string>;
  dirtyFields: Set<string>;
  touchedFields: Set<string>;
  visibleFields: Set<string>;
  formDependencies?: Array<any>; // Will be DependencyRule[]
  dependencyMap?: Record<string, {
    visible: boolean;
    disabled?: boolean;
    required?: boolean;
  }>;
  isDirty: boolean; // Has any field changed?
  isValid: boolean; // Are all visible fields valid?
  isSubmitting: boolean;
  isLoading: boolean;
}

export type InitialValues = Record<string, FieldValue>;

export type FormErrors = Record<string, string>;

export interface FormSubmissionPayload {
  form_id: number;
  values: Record<string, FieldValue>;
  step?: number; // For multi-step forms
  metadata?: Record<string, unknown>;
}

export interface FormSubmissionResponse {
  success: boolean;
  id?: number; // Submission ID
  message?: string;
  errors?: Record<string, string>;
  redirect_to?: string;
  data?: Record<string, unknown>;
}

export interface FormConfig {
  autosave?: boolean;
  autosaveInterval?: number; // milliseconds
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  enableDependencies?: boolean;
  autoClearHiddenFields?: boolean;
  persistDrafts?: boolean;
  draftKey?: string;
  showRequiredIndicator?: boolean;
  showErrorSummary?: boolean;
  errorDisplayMode?: 'inline' | 'banner' | 'both';
}

export interface LoadFormResponse {
  success: boolean;
  data: FormDefinition;
  message?: string;
}

export interface ResolveFormResponse {
  success: boolean;
  data: ResolvedField[];
  message?: string;
}

export interface DisplayField extends ResolvedField {
  error?: string;
  value?: FieldValue;
  isDirty?: boolean;
  isVisible?: boolean;
}

export type FieldKeys<T extends FormDefinition> = T['fields'][number]['field_key'];

export type FormValues = Record<string, FieldValue>;

export default {
  type: 'FormTypes',
  version: '1.0.0',
} as const;

