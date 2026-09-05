'use client';
/**
 * StepCompensation — implements spreadsheet salary calculator exactly.
 * Gross = Basic + HRA + Allowance1
 * AMDB  = user-entered
 * Total = Gross + AMDB
 */
import { useWatch, useFormContext } from 'react-hook-form';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormCurrencyInput } from '../../../../components/form/FormCurrencyInput';
import { FormToggle } from '../../../../components/form/FormToggle';
import { useFieldPermissions } from '../../hooks/useEmployees';
import { toOpts, DEDUCTION_FROM, DEDUCTION_MONTHS } from '../../constants/employee.constants';
import { FormSection } from '@/components/form/FormSection';
import { useModeOfPaymentData } from '../../../modeofPayment/hooks/useModeOfPayment';

function SalaryBlock({ prefix, label }: { prefix: 'current' | 'joining'; label: string }) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => fp?.[n];

  const basic    = useWatch({ name: `${prefix}_basic` }) ?? 0;
  const hra      = useWatch({ name: `${prefix}_hra` }) ?? 0;
  const allow1   = useWatch({ name: `${prefix}_allowance1` }) ?? 0;
  const amdb     = useWatch({ name: `${prefix}_amdb` }) ?? 0;
  const gross    = Number(basic) + Number(hra) + Number(allow1);
  const total    = gross + Number(amdb);

  const fmt = (n: number) => n > 0 ? `₹${new Intl.NumberFormat('en-IN').format(Math.round(n))}` : '₹0';

  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormCurrencyInput name={`${prefix}_basic`}      label="Basic"      fieldPerm={f('basic')} />
        <FormCurrencyInput name={`${prefix}_hra`}        label="HRA"        fieldPerm={f('hra')} />
        <FormCurrencyInput name={`${prefix}_allowance1`} label="Allowance1" fieldPerm={f('allowance1')} />
      </div>

      <div style={{ margin: '10px 0', padding: '8px 12px', background: 'var(--surface3)', borderRadius: 'var(--r)', display: 'flex', gap: 20, fontSize: 13 }}>
        <span style={{ color: 'var(--ink3)' }}>Gross Salary PM:</span>
        <strong style={{ color: 'var(--ink)' }}>{fmt(gross)}</strong>
        <span style={{ color: 'var(--ink4)', fontSize: 11 }}>= Basic + HRA + Allowance1</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormCurrencyInput name={`${prefix}_amdb`} label="AMDB PM" hint="Additional Monthly Discretionary Bonus" fieldPerm={f('amdb')} />
        <div className="form-field">
          <label className="field-label">Total Earning PM</label>
          <div style={{ padding: '8px 12px', background: 'var(--surface3)', borderRadius: 'var(--r)', fontSize: 16, fontWeight: 600, color: 'var(--blue)' }}>{fmt(total)}</div>
          <p className="field-hint">Gross + AMDB</p>
        </div>
      </div>
    </div>
  );
}

interface Props { isEdit: boolean; employeeId: number | null }

export function StepCompensation(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => fp?.[n];
  const { data: modesOfPayment = [] } = useModeOfPaymentData();
  const assetDeduction = useWatch({ name: 'asset_deduction_applicable' });
  const security       = useWatch({ name: 'security_amount' }) ?? 0;
  const months         = useWatch({ name: 'deduction_months' }) ?? '';

  const monthCount = parseInt(months) || 0;
  const monthly    = monthCount > 0 ? Math.floor(Number(security) / monthCount) : 0;
  const lastInst   = monthly > 0 ? Number(security) - monthly * (monthCount - 1) : 0;

  return (
    <FormSection fields={[f('salary_mode'), f('asset_deduction_applicable'), f('deduction_months'), f('deduction_from'), f('security_amount')]}>
    <div style={{ display: 'grid', gap: 20 }}>
      <FormSelect name="salary_mode" label="Mode of Payment" options={toOpts(modesOfPayment.map((m: any) => m.name))} placeholder="Select" fieldPerm={f('salary_mode')}  />
      <SalaryBlock prefix="current" label="Current Salary" />
      <SalaryBlock prefix="joining" label="Salary at Joining" />

      {/* Asset Deduction */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r2)', padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Asset Deduction</div>
        <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 8 }}>Deduction for company assets issued to employee</div>
        <FormToggle name="asset_deduction_applicable" label="Asset Deduction Applicable" fieldPerm={f('asset_deduction_applicable')} />
        {assetDeduction && (
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <FormCurrencyInput name="security_amount"  label="Security Amount" fieldPerm={f('security_amount')} />
              <FormSelect        name="deduction_months" label="Deduction Months" options={toOpts(DEDUCTION_MONTHS)} placeholder="Select" fieldPerm={f('deduction_months')} />
              <FormSelect        name="deduction_from"   label="Deduct From"     options={toOpts(DEDUCTION_FROM)} placeholder="Select" fieldPerm={f('deduction_from')} />
            </div>
            {monthly > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-field">
                  <label className="field-label">Monthly Deduction</label>
                  <div style={{ padding: '8px 12px', background: 'var(--surface3)', borderRadius: 'var(--r)', fontWeight: 600 }}>
                    ₹{new Intl.NumberFormat('en-IN').format(monthly)}
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Last Installment Amount</label>
                  <div style={{ padding: '8px 12px', background: 'var(--surface3)', borderRadius: 'var(--r)', fontWeight: 600 }}>
                    ₹{new Intl.NumberFormat('en-IN').format(lastInst)}
                  </div>
                </div>
              </div>
            )}
            <FormCurrencyInput name="final_monthly_deduction" label="Final Monthly Deduction (override)" hint="Optional — overrides the auto-calculated monthly figure if set" fieldPerm={f('final_monthly_deduction')} />
          </div>
        )}
      </div>
    </div>
    </FormSection>
  );
}
