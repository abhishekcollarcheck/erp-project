export interface ResolvedField {
  id: number;
  field_type: string;
  label: string;
  field_key: string;
  section: string | null;
  placeholder?: string | null;
  help_text?: string | null;
  is_required: boolean;
  is_readonly: boolean;
  width: number;
  options?: { label: string; value: string }[];
  dynamic_source?: string | null;
  visibility_conditions?: string | null;
  resolved: {
    can_view: boolean;
    can_edit: boolean;
    can_copy: boolean;
    can_download: boolean;
    is_masked: boolean;
  };
}

export interface MultiStepFormProps {
  formId: number;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  readOnly?: boolean;
  recordId?: number;
  mode?: 'create' | 'edit';
  autoSaveEnabled?: boolean;
  onSaveDraft?: (data: any) => Promise<void>;
}