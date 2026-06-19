'use client';
/**
 * useActionCompany.ts
 *
 * Action-Level Company Selection — for use inside forms only.
 *
 * IMPORTANT DISTINCTION from useCompany():
 *   useCompany()       → reads/writes Redux activeCompanyId (persistent)
 *   useActionCompany() → local React state only, resets when form closes
 *
 * This implements the "Action-Level Company Selection Model":
 *   - No global company switch
 *   - Company is selected per action (form submit)
 *   - Value lives in the form's local state
 *   - Single-company users: companyId is automatic, no dropdown shown
 *
 * Usage in any form:
 *   const { companyId, CompanyField, isMultiCompany } = useActionCompany();
 *
 *   // Render the dropdown in the form:
 *   {isMultiCompany && <CompanyField />}
 *
 *   // Pass companyId in the submit payload:
 *   await api.createEmployee({ ...formData, company_id: companyId })
 */

import { useState, useMemo } from 'react';
import { useAppSelector } from '../../../store';
import {
  selectManagedCompanies,
  selectIsSuperAdmin,
  selectActiveCompanyId,
} from '../../../store/slices/authSlice';
import type { ManagedCompany } from '../../../types/auth.types';

interface UseActionCompanyReturn {
  /** The selected company_id to include in the form payload */
  companyId: number;
  /** True if this employee can access multiple companies */
  isMultiCompany: boolean;
  /** All companies this employee can act on */
  companies: ManagedCompany[];
  /** Call this when the user picks a company in the dropdown */
  setCompanyId: (id: number) => void;
  /**
   * Inline form field component — renders a styled company dropdown.
   * Returns null for single-company employees (no choice needed).
   * Drop this anywhere inside your form JSX.
   *
   * Props:
   *   label?    — field label (default: "Company")
   *   required? — shows required indicator (default: true)
   */
  CompanyField: (props?: { label?: string; required?: boolean }) => React.ReactElement | null;
}

export function useActionCompany(): UseActionCompanyReturn {
  const managedCompanies = useAppSelector(selectManagedCompanies);
  const isSuperAdmin = useAppSelector(selectIsSuperAdmin);
  const activeCompanyId = useAppSelector(selectActiveCompanyId);

  // Active companies only — suspended ones are visible but disabled
  const companies: ManagedCompany[] = useMemo(
    () => managedCompanies.length > 0 ? managedCompanies : [],
    [managedCompanies],
  );

  // Default to the current active company (from Redux) or the first available
  const defaultId = activeCompanyId
    ?? companies.find(c => c.is_primary)?.id
    ?? companies[0]?.id
    ?? 0;

  // LOCAL state — does NOT persist to Redux, does NOT affect other pages
  const [companyId, setCompanyId] = useState<number>(defaultId);

  const isMultiCompany = isSuperAdmin || companies.length > 1;

  // Inline form field — rendered as a function so it can be used inline in JSX
  // without needing a separate component import
  const CompanyField = (props?: { label?: string; required?: boolean }): React.ReactElement | null => {
    if (!isMultiCompany) return null;

    const label = props?.label ?? 'Company';
    const required = props?.required ?? true;

    return (
      <div className="fg">
        <label>
          {label}
          {required && <span className="req-mark"> *</span>}
        </label>
        <select value={companyId} onChange={e => setCompanyId(Number(e.target.value))}
          required={required}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--r)',
            fontSize: 13,
            fontFamily: 'var(--font)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        >
          <option value="" disabled>Select company…</option>
          {companies.map(co => (
            <option key={co.id} value={co.id} disabled={!co.is_active}>
              {co.name}
              {!co.is_active ? ' (Suspended)' : ''}
              {!isSuperAdmin && co.manager_role ? ` · ${co.manager_role}` : ''}
            </option>
          ))}
        </select>
        {!companyId && (
          <p className="field-error" role="alert">Please select a company</p>
        )}
      </div>
    );
  };

  return { companyId, isMultiCompany, companies, setCompanyId, CompanyField };
}
