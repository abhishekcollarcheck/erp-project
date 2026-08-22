export interface PermGroup {
  id: number;
  company_id: number;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  is_system: boolean;
  is_active: boolean;
  member_count: number;
  permissions?: { id: number; slug: string; module: string; action: string }[];
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  designation?: string;
  user?: { id: number; email: string };
}

export type View = 'groups' | 'edit';

export interface Form {
  id: number;
  name: string;
  fields?: Array<{
    id: number;
    field_key: string;
    name: string;
    [key: string]: any;
  }>;
  moduleId?: number;
  moduleName?: string;
  moduleKey?: string;
  [key: string]: any;
}

export interface Module {
  id: number;
  name: string;
  slug?: string;
  permission_key?: string;
  [key: string]: any;
}

export type ModuleDef = { key: string; label: string };