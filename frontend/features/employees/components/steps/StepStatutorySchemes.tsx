'use client';
import { useEffect } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import { FormToggle }        from '../../../../components/form/FormToggle';
import { FormSelect }        from '../../../../components/form/FormSelect';
import { FormInput }         from '../../../../components/form/FormInput';
import { FormCurrencyInput } from '../../../../components/form/FormCurrencyInput';
import { FormDatePicker }    from '../../../../components/form/FormDatePicker';
import {
  toOpts,
  PF_EMPLOYER_FROM,
  MEDICLAIM_STATUS,
  RD_TERM,
  DEDUCTION_FROM,
} from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

function computeRdMaturity(
  openingDate: string | null | undefined,
  termStr:     string | null | undefined,
  empAmt:      number | null | undefined,
  emplrAmt:    number | null | undefined,
): { maturityDate: string | null; maturityAmount: number } {
  if (!openingDate || !termStr || termStr === 'N/A') {
    return { maturityDate: null, maturityAmount: 0 };
  }
  const months = parseInt(termStr, 10);
  if (isNaN(months) || months <= 0) return { maturityDate: null, maturityAmount: 0 };

  const d = new Date(openingDate);
  if (isNaN(d.getTime())) return { maturityDate: null, maturityAmount: 0 };

  d.setMonth(d.getMonth() + months);
  const maturityDate   = d.toISOString().split('T')[0];
  const totalMonthly   = (Number(empAmt) || 0) + (Number(emplrAmt) || 0);
  const maturityAmount = totalMonthly * months;

  return { maturityDate, maturityAmount };
}

function formatINR(n: number): string {
  if (!n) return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function StepStatutorySchemes(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  const { setValue } = useFormContext();

  const pfStatus   = useWatch({ name: 'pf_status' });
  const esicStatus = useWatch({ name: 'esic_status' });
  const mediStatus = useWatch({ name: 'mediclaim_status' });
  const rdScheme   = useWatch({ name: 'rd_scheme' });

  const rd_opening_date    = useWatch({ name: 'rd_opening_date' });
  const rd_term            = useWatch({ name: 'rd_term' });
  const rd_amount_employee = useWatch({ name: 'rd_amount_employee' });
  const rd_amount_employer = useWatch({ name: 'rd_amount_employer' });

  useEffect(() => {
    if (!rdScheme) {
      setValue('rd_maturity_date',   null,       { shouldDirty: false });
      setValue('rd_maturity_amount', null,       { shouldDirty: false });
      setValue('rd_status',          'Inactive', { shouldDirty: false });
      return;
    }

    const { maturityDate, maturityAmount } = computeRdMaturity(
      rd_opening_date, rd_term, rd_amount_employee, rd_amount_employer,
    );

    setValue('rd_maturity_date',   maturityDate,              { shouldDirty: false });
    setValue('rd_maturity_amount', maturityAmount || null,    { shouldDirty: false });
    setValue('rd_status',          'Active',                  { shouldDirty: false });
  }, [rdScheme, rd_opening_date, rd_term, rd_amount_employee, rd_amount_employer, setValue]);

  const rd_maturity_amount = useWatch({ name: 'rd_maturity_amount' });

  return (
    <FormSection fields={[f('pf_status'), f('uan_number'), f('epfo_member_id'), f('pf_contribution_pct'), f('pf_employer_from'), f('esic_status'), f('esic_number'), f('mediclaim_status'), f('mediclaim_number'), f('mediclaim_amount'), f('rd_scheme'), f('rd_opening_date'), f('rd_account_number'), f('rd_deduction_from'), f('rd_amount_employee'), f('rd_amount_employer'), f('rd_maturity_date')]}>
    <div style={{ display: 'grid', gap: 20 }}>

      {/* ── Provident Fund ──────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Provident Fund</div>
        <FormToggle name="pf_status" label="PF Applicable" showValue fieldPerm={f('pf_status')} />
        {pfStatus && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <FormInput name="uan_number" label="UAN Number" placeholder="12 digits" maxLength={12} hint="Universal Account Number" fieldPerm={f('uan_number')} />
            <FormInput name="epfo_member_id" label="EPFO Member ID" fieldPerm={f('epfo_member_id')} />
            <FormInput name="pf_contribution_pct" label="PF Contribution % of Basic" type="number" hint="e.g. 12" fieldPerm={f('pf_contribution_pct')} />
            <FormSelect name="pf_employer_from" label="Employer Contribution From" options={toOpts(PF_EMPLOYER_FROM)} placeholder="Select" fieldPerm={f('pf_employer_from')} />
            <FormCurrencyInput name="pf_employee_12" label="PF Employee (12%)" fieldPerm={f('pf_employee_12')} />
            <FormCurrencyInput name="eps_employer_833" label="EPS Employer (8.33%)" fieldPerm={f('eps_employer_833')} />
            <FormCurrencyInput name="epf_eps_diff_367" label="EPF/EPS Diff (3.67%)" fieldPerm={f('epf_eps_diff_367')} />
          </div>
        )}
      </div>

      {/* ── ESI ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>ESI</div>
        <FormToggle name="esic_status" label="ESI Applicable" showValue fieldPerm={f('esic_status')} />
        {esicStatus && (
          <div style={{ marginTop: 12 }}>
            <FormInput name="esic_number" label="ESI Number" fieldPerm={f('esic_number')} />
          </div>
        )}
      </div>

      {/* ── Mediclaim ───────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Mediclaim</div>
        <FormSelect name="mediclaim_status" label="Mediclaim Status" options={toOpts(MEDICLAIM_STATUS)} placeholder="Select" fieldPerm={f('mediclaim_status')} />
        {mediStatus === 'Yes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <FormInput name="mediclaim_number" label="Mediclaim Policy Number" fieldPerm={f('mediclaim_number')} />
            <FormCurrencyInput name="mediclaim_amount" label="Mediclaim Amount" fieldPerm={f('mediclaim_amount')} />
          </div>
        )}
      </div>

      {/* ── RD Scheme ───────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>RD Scheme</div>
        <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 8 }}>Recurring Deposit deducted from salary</div>
        <FormToggle name="rd_scheme" label="RD Scheme Applicable" showValue fieldPerm={f('rd_scheme')} />

        {rdScheme && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <FormSelect name="rd_term" label="RD Term" options={toOpts(RD_TERM)} placeholder="Select term" fieldPerm={f('rd_term')} />
            <FormDatePicker name="rd_opening_date" label="RD Opening Date" fieldPerm={f('rd_opening_date')} />
            <FormInput name="rd_account_number" label="RD Account Number" fieldPerm={f('rd_account_number')} />
            <FormSelect name="rd_deduction_from" label="Deduction From" options={toOpts(DEDUCTION_FROM)} placeholder="Select" fieldPerm={f('rd_deduction_from')} />
            <FormCurrencyInput name="rd_amount_employee" label="RD Amount (Employee)" fieldPerm={f('rd_amount_employee')} />
            <FormCurrencyInput name="rd_amount_employer" label="RD Amount (Employer)" fieldPerm={f('rd_amount_employer')} />

            <FormDatePicker
              name="rd_maturity_date"
              label="RD Maturity Date"
              disabled
              hint="Auto-calculated: opening date + term"
              fieldPerm={f('rd_maturity_date')}
            />
            <div className="form-field fg">
              <label className="field-label">RD Maturity Amount</label>
              <input
                type="text"
                className="form-input readonly"
                readOnly
                value={rd_maturity_amount ? formatINR(Number(rd_maturity_amount)) : '—'}
                tabIndex={-1}
                aria-label="RD Maturity Amount (auto-calculated)"
              />
              <p className="field-hint">Auto-calculated: (Emp + Emplr) × months</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </FormSection>
  );
}
