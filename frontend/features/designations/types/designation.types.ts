
export interface DesignationEmployee {
  id:             number;
  first_name:     string;
  last_name:      string;
  employee_code:  string;
  status:         string;
  avatar_url?:    string | null;
  department_id?: number | null;
}

export interface Designation {
  id:                 number;
  designation_name:   string;
  is_active:          boolean;
  created_at?:        string;
  updated_at?:        string;
  employee_count?:    number;
  employees?:         DesignationEmployee[];
}

export interface DesignationStats {
  total:           number;
  active:          number;
  inactive:        number;
  deptSpecific:    number;
  topDesignation:  { id: number; name: string; count: number } | null;
}

export interface CreateDesignationDto {
  designation_name: string;
}

export interface UpdateDesignationDto {
  designation_name?: string;
  is_active?:     boolean;
}

export interface DesignationQueryParams {
  is_active?:     'true' | 'false' | 'all';
  search?:        string;
}
