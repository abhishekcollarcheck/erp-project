export interface SubDesignationEmployee {
  id:             number;
  first_name:     string;
  last_name:      string;
  employee_code:  string;
  status:         string;
  avatar_url?:    string | null;
  department_id?: number | null;
  sub_department_id?: number | null;
}

export interface SubDesignation {
  id:             number;
  name:           string;
  is_active:      boolean;
  created_at?:    string;
  updated_at?:    string;
  // Computed (from aggregated query)
  employee_count?: number;
  // Associations
  employees?:     SubDesignationEmployee[];
}

export interface SubDesignationStats {
  total:              number;
  active:             number;
  inactive:           number;
  topSubDesignation:  { id: number; name: string; count: number } | null;
}

export interface CreateSubDesignationDto {
  name: string;
}

export interface UpdateSubDesignationDto {
  name?:      string;
  is_active?: boolean;
}

export interface SubDesignationQueryParams {
  is_active?: 'true' | 'false' | 'all';
  search?:    string;
}