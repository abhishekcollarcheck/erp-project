'use client';
import { useEffect } from 'react';
import { useFormContext} from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { useFieldPermissions, useNextCode, resolveFieldPerm } from '../../hooks/useEmployees';
import { toOpts, EMPLOYEE_STATUS, EMPLOYMENT_TYPE } from '../../constants/employee.constants';
import { useCompany } from '../../../company/hooks/useCompany';
import { FormSection } from '../../../../components/form/FormSection';
import { useDepartments } from '../../../../features/departments/hooks/useDepartments';
import { useSubDepartments } from '../../../../features/sub-departments/hooks/useSubDepartments';
import { useDesignations } from '../../../../features/designations/hooks/useDesignations';
import { useSubDesignations } from '../../../../features/sub-designations/hooks/useSubDesignations';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface Props {
  isEdit: boolean;
  employeeId?: number | null; // ✅ Made optional since it's not used, or use it if needed
}

interface SelectOption {
  value: string | number;
  label: string;
}

interface DataItem {
  id?: number;
  name?: string;
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Transform API data to SelectOption format
 * ✅ Handles different data structures
 * ✅ Type-safe
 * ✅ Reusable across the component
 */
function toSelectOptions<T extends DataItem>(
  items: T[] | undefined,
  valueKey: keyof T = 'id' as keyof T,
  labelKey: keyof T = 'name' as keyof T,
): SelectOption[] {
  if (!items || !Array.isArray(items)) return [];
  
  return items.map((item) => ({
    value: item[valueKey] as string | number,
    label: String(item[labelKey] || ''),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function StepBasic({ isEdit, employeeId }: Props) {
  // ─── Form & Permission Management ──────────────────────────────────────
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { data: codes } = useNextCode();
  const { setValue, watch } = useFormContext();
  
  // ─── Company Data ──────────────────────────────────────────────────────
  const { company } = useCompany();

  // ─── Dynamic Data from APIs (✅ NOW BEING USED) ────────────────────────
  const { 
    data: departments,
    isLoading: departmentsLoading,
    error: departmentsError 
  } = useDepartments();
  
  const { 
    data: subDepartments,
    isLoading: subDepartmentsLoading,
    error: subDepartmentsError 
  } = useSubDepartments();
  
  const { 
    data: designations,
    isLoading: designationsLoading,
    error: designationsError 
  } = useDesignations();
  
  const { 
    data: subDesignations,
    isLoading: subDesignationsLoading,
    error: subDesignationsError 
  } = useSubDesignations();

  // ─── Transform API Data to Select Options (✅ NEW) ─────────────────────
  const departmentOptions = toSelectOptions(departments);
  const subDepartmentOptions = toSelectOptions(subDepartments);
  const designationOptions = toSelectOptions(designations);
  const subDesignationOptions = toSelectOptions(subDesignations);

  // ─── Loading States (✅ NEW) ───────────────────────────────────────────
  const isLoadingMasterData = 
    departmentsLoading || 
    subDepartmentsLoading || 
    designationsLoading || 
    subDesignationsLoading;

  // ─── Error States (✅ NEW) ─────────────────────────────────────────────
  const hasErrors = 
    departmentsError || 
    subDepartmentsError || 
    designationsError || 
    subDesignationsError;

  // ─── Auto-fill reference code on create ───────────────────────────────
  useEffect(() => {
    if (!isEdit && codes?.ref && !watch('reference_code')) {
      setValue('reference_code', codes.ref, { shouldDirty: false });
    }
  }, [codes, isEdit, setValue, watch]); // ✅ FIXED: Added missing dependencies

  // ─── Auto-fill company ID ───────────────────────────────────────────────
  // ✅ FIXED: Added proper dependencies
  useEffect(() => {
    if (company?.id) {
      setValue('company_id', company.id);
    }
  }, [company, setValue]); // ✅ FIXED: Added setValue as dependency

  // ─── Show loading state while fetching master data ──────────────────────
  if (isLoadingMasterData) {
    return (
      <FormSection 
        fields={[
          f('reference_code'),
          f('company_id'),
          f('status'),
          f('first_name'),
          f('middle_name'),
          f('last_name'),
          f('employment_type'),
          f('email'),
          f('phone'),
          f('department_id'),
          f('sub_department_id'),
          f('designation_id'),
          f('sub_designation'),
        ]}
      >
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink4)' }}>
          ⏳ Loading department and designation data...
        </div>
      </FormSection>
    );
  }

  // ─── Show error state if data fetch failed ─────────────────────────────
  if (hasErrors) {
    return (
      <FormSection 
        fields={[
          f('reference_code'),
          f('company_id'),
          f('status'),
          f('first_name'),
          f('middle_name'),
          f('last_name'),
          f('employment_type'),
          f('email'),
          f('phone'),
          f('department_id'),
          f('sub_department_id'),
          f('designation_id'),
          f('sub_designation'),
        ]}
      >
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          color: 'var(--red)',
          background: 'var(--red-lt)',
          borderRadius: 'var(--r)',
          border: '1px solid var(--red-bd)'
        }}>
          ⚠️ Error loading department/designation data. Please refresh the page.
        </div>
      </FormSection>
    );
  }

  return (
    // <FormSection 
    //   fields={[
    //     f('reference_code'),
    //     f('company_id'),
    //     f('status'),
    //     f('first_name'),
    //     f('middle_name'),
    //     f('last_name'),
    //     f('employment_type'),
    //     f('email'),
    //     f('phone'),
    //     f('department_id'),
    //     f('sub_department_id'),
    //     f('designation_id'),
    //     f('sub_designation'),
    //   ]}
    // >
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Row 1: Reference Code & Company */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput
            name="reference_code"
            label="Reference Code"
            placeholder={codes?.ref ?? 'Auto-generated'}
            hint="Auto-generated, can be changed"
            // fieldPerm={f('reference_code')}
          />
          <FormInput
            name="company_id"
            label="Company"
            displayValue={company?.name}
            readOnly
            // fieldPerm={f('company_id')}
          />
        </div>

        {/* Row 2: First, Middle, Last Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <FormInput
            name="first_name"
            label="First Name"
            required
            placeholder="Rahul"
            // fieldPerm={f('first_name')}
          />
          <FormInput
            name="middle_name"
            label="Middle Name"
            placeholder="Kumar"
            // fieldPerm={f('middle_name')}
          />
          <FormInput
            name="last_name"
            label="Last Name"
            required
            placeholder="Sharma"
            // fieldPerm={f('last_name')}
          />
        </div>

        {/* Row 3: Status & Employment Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput
            name="status"
            label="Status"
            required
            // fieldPerm={f('status')}
            displayValue={EMPLOYEE_STATUS[0]}
            readOnly
          />
          <FormSelect
            name="employment_type"
            label="Employment Type"
            required
            options={toOpts(EMPLOYMENT_TYPE)}
            // fieldPerm={f('employment_type')}
          />
        </div>

        {/* Row 4: Email & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormInput
            name="email"
            label="Work Email"
            type="email"
            placeholder="rahul.sharma@company.com"
            // fieldPerm={f('email')}
          />
          <FormInput
            name="phone"
            label="Phone Number"
            type="tel"
            required
            placeholder="+91-9876543210"
            // fieldPerm={f('phone')}
          />
        </div>

        {/* Row 5: Department & Sub-Department (✅ NOW USING DYNAMIC DATA) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormSelect
            name="department_id"
            label="Department"
            required
            placeholder="Select Department"
            options={departmentOptions}  // ✅ FIXED: Using fetched data
            // fieldPerm={f('department_id')}
            disabled={!departmentOptions.length}
          />
          <FormSelect
            name="sub_department_id"
            label="Sub Department"
            placeholder="Select Sub Department"
            options={subDepartmentOptions}  // ✅ FIXED: Using fetched data
            // fieldPerm={f('sub_department_id')}
            disabled={!subDepartmentOptions.length}
          />
        </div>

        {/* Row 6: Designation & Sub-Designation (✅ NOW USING DYNAMIC DATA) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormSelect
            name="designation_id"
            label="Designation"
            required
            placeholder="Select Designation"
            options={designationOptions}  // ✅ FIXED: Using fetched data
            // fieldPerm={f('designation_id')}
            disabled={!designationOptions.length}
          />
          
          {/* ✅ NEW: Check if sub-designations should be dropdown or text input */}
          {subDesignationOptions.length > 0 ? (
            // Option A: If sub-designations exist, show as dropdown
            <FormSelect
              name="sub_designation"
              label="Sub Designation"
              placeholder="Select Sub Designation"
              options={subDesignationOptions}  // ✅ FIXED: Using fetched data
              // fieldPerm={f('sub_designation')}
              disabled={!subDesignationOptions.length}
            />
          ) : (
            // Option B: If no pre-defined sub-designations, show as text input
            <FormInput
              name="sub_designation"
              label="Sub Designation"
              placeholder="e.g. Senior, Lead"
              hint="Optional — free text"
              // fieldPerm={f('sub_designation')}
            />
          )}
        </div>
      </div>
    // </FormSection>
  );
}