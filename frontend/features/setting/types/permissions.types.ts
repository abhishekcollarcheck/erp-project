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