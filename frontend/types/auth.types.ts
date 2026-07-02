// ─── ManagedCompany ───────────────────────────────────────────────────────────
// A company this employee is assigned to manage via company_managers table

export interface CompanyRole {
  id: number;
  name: string;
  slug: string;
}

export interface ManagedCompany {
  id: number;
  name: string;
  slug: string | null;
  is_active: boolean;
  theme_color: string | null;

  manager_role: CompanyRole;
  role_name: string | null;

  is_primary: boolean;
  is_super_admin: boolean;

  active_modules: string[];

  role_id: number;
  role_slug: string;

  permissions: string[];
}

// ─── User (employee-as-identity) ──────────────────────────────────────────────

export interface User {
  id:               number;
  employeeId:       number;
  email:            string;
  fullName:         string;
  firstName:        string;
  lastName:         string;
  avatarUrl?:       string | null;
  companyId:        number;     // home company (where employee record lives)
  roleId:           number;
  roleSlug:         string;
  isSuperAdmin:     boolean;
  permissions:      string[];   // ['*'] for super admin, slugs for others
  managedCompanies: ManagedCompany[];  // companies this employee manages
}

export interface AuthState {
  user:            User | null;
  accessToken:     string | null;
  isAuthenticated: boolean;
  permissions:     string[];    // mirror of user.permissions for fast access
  activeCompanyId: number | null; // currently selected company (company switcher)
}

export interface OtpRequestDto {
  email_or_phone: string;
  channel?:       'email' | 'sms';
}

export interface OtpVerifyDto {
  email_or_phone: string;
  otp:            string;
}

export interface LoginResponse {
  accessToken: string;
  user:        User;
}

export interface TokenRefreshResponse {
  accessToken: string;
}
