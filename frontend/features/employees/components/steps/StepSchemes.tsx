'use client';
/**
 * StepSchemes — PF, ESIC, Mediclaim, RD Scheme
 *
 * Auto-calculated fields:
 *   rd_maturity_date   = rd_opening_date + rd_term (months)
 *   rd_maturity_amount = (rd_amount_employee + rd_amount_employer) × term_months
 *   rd_status          = 'Active' when rd_scheme=true, 'Inactive' otherwise
 *
 * Mirrors computeRdMaturity() from employees.helper.ts exactly.
 * All three fields are registered in RHF, included in the step payload,
 * and correctly restored from the DB in edit mode via methods.reset().
 */
import { useEffect } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import { FormToggle }        from '../../../../components/form/FormToggle';
import { FormSelect }        from '../../../../components/form/FormSelect';
import { FormInput }         from '../../../../components/form/FormInput';
import { FormCurrencyInput } from '../../../../components/form/FormCurrencyInput';
import { FormDatePicker }    from '../../../../components/form/FormDatePicker';
import { SectionTitle }      from '../../../../components/form/SectionTitle';
import {
  toOpts,
  PF_EMPLOYER_FROM,
  MEDICLAIM_STATUS,
  RD_TERM,
  DEDUCTION_FROM,
} from '../../constants/employee.constants';

interface Props { isEdit: boolean; employeeId: number | null }

// ─── Mirrors computeRdMaturity from employees.helper.ts ──────────────────────
function computeRdMaturity(
  openingDate: string | null | undefined,
  termStr:     string | null | undefined,
  empAmt:      number | null | undefined,
  emplrAmt:    number | null | undefined,
): { maturityDate: string | null; maturityAmount: number } {
  if (!openingDate || !termStr || termStr === 'N/A') {
    return { maturityDate: null, maturityAmount: 0 };
  }
  const months = parseInt(termStr, 10); // '12 Months' → 12
  if (isNaN(months) || months <= 0) return { maturityDate: null, maturityAmount: 0 };

  const d = new Date(openingDate);
  if (isNaN(d.getTime())) return { maturityDate: null, maturityAmount: 0 };

  d.setMonth(d.getMonth() + months);
  const maturityDate   = d.toISOString().split('T')[0]; // YYYY-MM-DD
  const totalMonthly   = (Number(empAmt) || 0) + (Number(emplrAmt) || 0);
  const maturityAmount = totalMonthly * months;

  return { maturityDate, maturityAmount };
}

function formatINR(n: number): string {
  if (!n) return '';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function StepSchemes(_: Props) {
  const { setValue } = useFormContext();

  const pfStatus   = useWatch({ name: 'pf_status' });
  const esicStatus = useWatch({ name: 'esic_status' });
  const mediStatus = useWatch({ name: 'mediclaim_status' });
  const rdScheme   = useWatch({ name: 'rd_scheme' });

  // ── RD source fields ──────────────────────────────────────────────────────
  const rd_opening_date    = useWatch({ name: 'rd_opening_date' });
  const rd_term            = useWatch({ name: 'rd_term' });
  const rd_amount_employee = useWatch({ name: 'rd_amount_employee' });
  const rd_amount_employer = useWatch({ name: 'rd_amount_employer' });

  // ── Auto-compute RD maturity fields ──────────────────────────────────────
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

  // ── Read back computed values for display ────────────────────────────────
  const rd_maturity_date   = useWatch({ name: 'rd_maturity_date' });
  const rd_maturity_amount = useWatch({ name: 'rd_maturity_amount' });

  return (
    <div style={{ display: 'grid', gap: 20 }}>

      {/* ── PF ──────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <SectionTitle title="PF (Provident Fund)" />
        <FormToggle name="pf_status" label="PF Applicable" showValue />
        {pfStatus && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <FormInput name="uan_number" label="UAN Number" placeholder="12 digits" maxLength={12} hint="Universal Account Number" />
            <FormInput name="epfo_member_id" label="EPFO Member ID" />
            <FormInput name="pf_contribution_pct" label="PF Contribution % of Basic" type="number" hint="e.g. 12" />
            <FormSelect name="pf_employer_from" label="Employer Contribution From" options={toOpts(PF_EMPLOYER_FROM)} placeholder="Select" />
          </div>
        )}
      </div>

      {/* ── ESIC ────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <SectionTitle title="ESIC (Health Insurance)" />
        <FormToggle name="esic_status" label="ESIC Applicable" showValue />
        {esicStatus && (
          <div style={{ marginTop: 12 }}>
            <FormInput name="esic_number" label="ESIC Number" />
          </div>
        )}
      </div>

      {/* ── Mediclaim ───────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <SectionTitle title="Mediclaim (Health Insurance)" />
        <FormSelect name="mediclaim_status" label="Mediclaim Status" required options={toOpts(MEDICLAIM_STATUS)} />
        {mediStatus === 'Yes' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <FormInput name="mediclaim_number" label="Mediclaim Policy Number" />
            <FormCurrencyInput name="mediclaim_amount" label="Mediclaim Amount" />
          </div>
        )}
      </div>

      {/* ── RD Scheme ───────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <SectionTitle title="RD Scheme (Retention Scheme)" subtitle="Recurring Deposit deducted from salary" />
        <FormToggle name="rd_scheme" label="RD Scheme Applicable" showValue />

        {rdScheme && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <FormSelect name="rd_term" label="RD Term" options={toOpts(RD_TERM)} placeholder="Select term" />
            <FormDatePicker name="rd_opening_date" label="RD Opening Date" />
            <FormInput name="rd_account_number" label="RD Account Number" />
            <FormSelect name="rd_deduction_from" label="Deduction From" options={toOpts(DEDUCTION_FROM)} placeholder="Select" />
            <FormCurrencyInput name="rd_amount_employee" label="RD Amount (Employee)" />
            <FormCurrencyInput name="rd_amount_employer" label="RD Amount (Employer)" />

            {/* Computed — registered in RHF via FormDatePicker / hidden input */}
            <FormDatePicker
              name="rd_maturity_date"
              label="RD Maturity Date"
              disabled
              hint="Auto-calculated: opening date + term"
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
              <p className="field-hint">
                Auto-calculated: (Emp + Emplr) × months
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}