// ─── Field types ──────────────────────────────────────────────────────────────

export const FIELD_TYPES = [
  'text','email','number','password','textarea',
  'select','multi_select','radio','checkbox',
  'date','datetime','file','image',
  'phone','url','currency','percentage',
] as const;
export type FieldType = typeof FIELD_TYPES[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text:'Text Input', email:'Email', number:'Number', password:'Password', textarea:'Textarea',
  select:'Select Dropdown', multi_select:'Multi Select', radio:'Radio Buttons', checkbox:'Checkbox',
  date:'Date Picker', datetime:'Date & Time', file:'File Upload', image:'Image Upload',
  phone:'Phone Number', url:'URL', currency:'Currency', percentage:'Percentage',
};

export const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  text:'T', email:'@', number:'#', password:'🔒', textarea:'≡', select:'▼',
  multi_select:'☑', radio:'◉', checkbox:'☐', date:'📅', datetime:'🕐',
  file:'📎', image:'🖼', phone:'📞', url:'🔗', currency:'₹', percentage:'%',
};

// ─── Core types ───────────────────────────────────────────────────────────────

export interface Role {
  id:           number;
  company_id:   number;
  name:         string;
  slug:         string;
  description?: string | null;
  is_system:    boolean;
  member_count?: number;
  created_at?:  string;
  updated_at?:  string;
}

export interface HrModule {
  id:          number;
  company_id:  number;
  name:        string;
  slug:        string;
  icon?:       string | null;
  description?:string | null;
  sort_order:  number;
  is_active:   boolean;
  is_system:   boolean;
  forms?:      Pick<FormDefinition,'id'|'name'|'slug'>[];
}

export interface FormDefinition {
  id:          number;
  company_id:  number;
  module_id:   number;
  name:        string;
  slug:        string;
  description?:string | null;
  sort_order:  number;
  is_active:   boolean;
  is_system:   boolean;
  fields?:     DynamicField[];
  module?:     Pick<HrModule,'id'|'name'|'slug'>;
}

export interface FieldOption {
  id?:         number;
  field_id?:   number;
  label:       string;
  value:       string;
  sort_order?: number;
  is_active?:  boolean;
  is_default?: boolean;
}

export interface DynamicField {
  // Core properties
  id:                    number;
  company_id:            number;
  form_id:               number;
  field_type:            FieldType;
  label:                 string;
  field_key:             string;
  placeholder?:          string | null;
  help_text?:            string | null;
  
  // Section & display
  section?:              string | null;
  width?:                number;           // Field width: 25, 33, 50, 66, 75, 100 (%)
  column_span?:          number;           // Grid columns: 1-4
  
  // Status flags
  is_required:           boolean;
  is_readonly:           boolean;
  is_hidden:             boolean;
  is_unique:             boolean;
  is_active:             boolean;
  
  // Value
  default_value?:        string | null;
  sort_order:            number;
  
  // Validation rules
  min_length?:           number | null;
  max_length?:           number | null;
  min_value?:            number | null;
  max_value?:            number | null;
  regex_pattern?:        string | null;
  custom_validation?:    string | null;   // Custom validation logic
  
  // Dynamic data sources (for select/dropdown fields)
  dynamic_source?:       string | null;   // 'departments', 'roles', 'employees', 'designations', 'leave_types', 'asset_categories', 'custom'
  dynamic_source_label?: string | null;   // Field to use as label (e.g., 'name')
  dynamic_source_value?: string | null;   // Field to use as value (e.g., 'id')
  dynamic_source_filter?:string | null;   // JSON filter like {"is_active":true}
  
  // Conditional visibility
  visibility_conditions?:string | null;   // JSON condition for showing/hiding field
  
  // Relations
  options?:              FieldOption[];
  
  // Resolved at runtime (from permissions)
  resolved?: {
    can_view:            boolean;
    can_edit:            boolean;
    can_copy:            boolean;
    can_download:        boolean;
    is_masked:           boolean;
  };
}

export interface FieldPermissionEntry {
  can_view:     boolean;
  can_edit:     boolean;
  can_copy:     boolean;
  can_download: boolean;
  is_masked:    boolean;
}

// role_id → field_id → FieldPermissionEntry
export type PermissionMatrix = Record<number, Record<number, FieldPermissionEntry>>;

export interface PermissionMatrixResponse {
  roles:   Role[];
  fields:  DynamicField[];
  matrix:  PermissionMatrix;
}

export interface SystemPermission {
  id:          number;
  module:      string;
  action:      string;
  slug:        string;
  description?: string | null;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateRoleDto      { name: string; slug?: string; description?: string; }
export interface UpdateRoleDto      { name?: string; description?: string; }
export interface CreateModuleDto    { name: string; slug?: string; icon?: string; description?: string; sort_order?: number; }
export interface UpdateModuleDto    { name?: string; icon?: string; description?: string; sort_order?: number; is_active?: boolean; }
export interface CreateFormDto      { name: string; slug?: string; description?: string; sort_order?: number; }
export interface UpdateFormDto      { name?: string; description?: string; sort_order?: number; is_active?: boolean; }

export interface CreateFieldDto {
  // Required
  field_type:            FieldType;
  label:                 string;
  
  // Optional identifiers & display
  field_key?:            string;
  section?:              string;
  placeholder?:          string;
  help_text?:            string;
  default_value?:        string;
  sort_order?:           number;
  width?:                number;           // Field width percentage
  column_span?:          number;           // Grid column span
  
  // Flags
  is_required?:          boolean;
  is_readonly?:          boolean;
  is_hidden?:            boolean;
  is_unique?:            boolean;
  
  // Validation
  min_length?:           number;
  max_length?:           number;
  min_value?:            number;
  max_value?:            number;
  regex_pattern?:        string;
  custom_validation?:    string;           // Custom validation logic
  
  // Dynamic sources
  dynamic_source?:       string;           // DB source: 'departments', 'roles', etc.
  dynamic_source_label?: string;           // Label field name
  dynamic_source_value?: string;           // Value field name
  dynamic_source_filter?:string;           // JSON filter
  
  // Conditional visibility
  visibility_conditions?:string;           // JSON visibility condition
  
  // Options (for select/radio/checkbox)
  options?:              Omit<FieldOption,'id'|'field_id'>[];
}

export interface SetPermissionDto extends FieldPermissionEntry { role_id: number; }

export interface BulkPermissionDto {
  role_id:     number;
  permissions: (FieldPermissionEntry & { field_id: number })[];
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const FIELD_CATEGORIES = {
  'Text Fields': ['text','email','password','textarea','phone','url'],
  'Selection':   ['select','multi_select','radio','checkbox'],
  'Numeric':     ['number','currency','percentage'],
  'Date & Time': ['date','datetime'],
  'File Upload': ['file','image'],
} as const;

export const PERM_FLAGS: { key: keyof FieldPermissionEntry; label: string; color: string }[] = [
  { key: 'can_view',     label: 'View',     color: 'var(--blue)'  },
  { key: 'can_edit',     label: 'Edit',     color: 'var(--green)' },
  { key: 'can_copy',     label: 'Copy',     color: 'var(--teal)'  },
  { key: 'can_download', label: 'Download', color: 'var(--purple)'},
  { key: 'is_masked',    label: 'Mask',     color: 'var(--amber)' },
];

export const DEFAULT_PERM: FieldPermissionEntry = {
  can_view: false, can_edit: false, can_copy: false, can_download: false, is_masked: false,
};

export const FULL_PERM: FieldPermissionEntry = {
  can_view: true, can_edit: true, can_copy: true, can_download: true, is_masked: false,
};