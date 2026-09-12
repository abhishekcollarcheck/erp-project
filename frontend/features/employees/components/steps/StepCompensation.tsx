'use client';
/**
 * StepCompensation — Employee compensation package.
 *   Gross = Basic + HRA + Allowance1
 *   Total = Gross + AMDB
 *
 * One package ("current") is captured; the joining package is saved as the same.
 * When the employee is On Probation, HR can plan a different package that starts
 * the day probation is passed ("Salary change after probation"), optionally
 * paying the probation-period difference as arrears.
 */
import { useWatch } from 'react-hook-form';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormCurrencyInput } from '../../../../components/form/FormCurrencyInput';
import { FormToggle } from '../../../../components/form/FormToggle';
import { FormCheckbox } from '../../../../components/form/FormCheckbox';
import { useFieldPerm, useStepFieldPerms } from '../../hooks/useFieldPerm';
import { toOpts, DEDUCTION_FROM, DEDUCTION_MONTHS } from '../../constants/employee.constants';
import { FormSection } from '@/components/form/FormSection';
import { useModeOfPaymentData } from '../../../modeofPayment/hooks/useModeOfPayment';

const money = (n: number) => (n > 0 ? `₹${new Intl.NumberFormat('en-IN').format(Math.round(n))}` : '');

/** Read-only computed field, styled like the screenshot's "Auto" inputs. */
function AutoField({ label, value, placeholder, hint }: { label: string; value: number; placeholder: string; hint: string }) {
  return (
    <div className="form-field">
      <label className="field-label">{label}</label>
      <div
        style={{
          padding: '9px 12px', borderRadius: 'var(--r)', border: '1px solid var(--border)',
          background: 'var(--surface2)', fontSize: 14, minHeight: 38,
          color: value > 0 ? 'var(--blue)' : 'var(--ink4)', fontWeight: value > 0 ? 600 : 400,
        }}
      >
        {value > 0 ? money(value) : placeholder}
      </div>
      <p className="field-hint">{hint}</p>
    </div>
  );
}

/**
 * `fieldPrefix` — RHF field-name prefix ("current" | "after_probation").
 * `permPrefix` — dynamic_fields permission-key prefix ("" for the current
 *   package: perm keys basic/hra/…; "after_probation_" for the second package).
 */
function SalaryBlock({ fieldPrefix, permPrefix, suffixLabel }: { fieldPrefix: string; permPrefix: string; suffixLabel: string }) {
  const f = useFieldPerm();
  const pk = (k: string) => f(`${permPrefix}${k}`);

  const basic  = Number(useWatch({ name: `${fieldPrefix}_basic` }) ?? 0);
  const hra    = Number(useWatch({ name: `${fieldPrefix}_hra` }) ?? 0);
  const allow1 = Number(useWatch({ name: `${fieldPrefix}_allowance1` }) ?? 0);
  const amdb   = Number(useWatch({ name: `${fieldPrefix}_amdb` }) ?? 0);
  const gross  = basic + hra + allow1;
  const total  = gross + amdb;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <FormCurrencyInput name={`${fieldPrefix}_basic`}      label={`Basic ${suffixLabel}`}       fieldPerm={pk('basic')} />
      <FormCurrencyInput name={`${fieldPrefix}_hra`}        label={`HRA ${suffixLabel}`}         fieldPerm={pk('hra')} />
      <FormCurrencyInput name={`${fieldPrefix}_allowance1`} label={`Allowance 1 ${suffixLabel}`} fieldPerm={pk('allowance1')} />
      <AutoField label={`Gross Salary P.M ${suffixLabel}`} value={gross} placeholder="Auto" hint="Basic + HRA + Allowance" />
      <FormCurrencyInput name={`${fieldPrefix}_amdb`} label={`AMDB P.M ${suffixLabel}`} hint="Additional Monthly Discretionary Bonus — blank = auto 30%" fieldPerm={pk('amdb')} />
      <AutoField label={`Total Earning P.M ${suffixLabel}`} value={total} placeholder="Auto" hint="Gross + AMDB" />
    </div>
  );
}

interface Props { isEdit: boolean; employeeId: number | null }

export function StepCompensation(_: Props) {
  const f = useFieldPerm();
  const sp = useStepFieldPerms();
  const { data: modesOfPayment = [] } = useModeOfPaymentData();

  const onProbation      = useWatch({ name: 'on_probation' });
  const changeAfterProb  = useWatch({ name: 'salary_change_after_probation' });
  const assetDeduction   = useWatch({ name: 'asset_deduction_applicable' });
  const security          = Number(useWatch({ name: 'security_amount' }) ?? 0);
  const months            = useWatch({ name: 'deduction_months' }) ?? '';

  const monthCount = parseInt(months) || 0;
  const monthly    = monthCount > 0 ? Math.floor(security / monthCount) : 0;
  const lastInst   = monthly > 0 ? security - monthly * (monthCount - 1) : 0;

  const hintBox = (text: string) => (
    <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--r)', lineHeight: 1.5 }}>
      {text}
    </div>
  );

  return (
    <FormSection fields={sp('compensation')}>
    <div style={{ display: 'grid', gap: 20 }}>

      {/* ── Payment ──────────────────────────────────────────────────────── */}
      <div>
        <div className="ct" style={{ marginBottom: 10 }}>Payment</div>
        <FormSelect name="salary_mode" label="Mode of Payment" options={toOpts(modesOfPayment.map((m: any) => m.name))} placeholder="Select" fieldPerm={f('salary_mode')} />
      </div>

      {hintBox('Joining salary is saved as the same as this package. After raises, edit the employee to record year-wise salary history.')}

      {/* ── Salary (current) ─────────────────────────────────────────────── */}
      <div>
        <div className="ct" style={{ marginBottom: 10 }}>Salary</div>
        <SalaryBlock fieldPrefix="current" permPrefix="" suffixLabel="(Current)" />
      </div>

      {/* ── Salary after probation ───────────────────────────────────────── */}
      {!onProbation ? (
        hintBox('Set Probation to Yes on Commitment & Probation to plan a different package after confirmation.')
      ) : (
        <div style={{ display: 'grid', gap: 14, padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r2)' }}>
          <FormCheckbox
            name="salary_change_after_probation"
            label="Salary change after probation"
            hint="Pay this package until probation is passed; the higher package starts from that day."
            fieldPerm={f('salary_change_after_probation')}
          />

          {changeAfterProb && (
            <div style={{ display: 'grid', gap: 14 }}>
              {hintBox('Example: ₹30,000 during probation and ₹35,000 after. Days before the pass date stay on ₹30,000; from the pass date salary is ₹35,000.')}
              <div>
                <div className="ct" style={{ marginBottom: 10 }}>Salary After Probation</div>
                <SalaryBlock fieldPrefix="after_probation" permPrefix="after_probation_" suffixLabel="(After Probation)" />
              </div>
              <FormCheckbox
                name="give_arrears_after_probation"
                label="Give arrears after probation"
                hint="Pay the difference for probation months in the next processed salary."
                fieldPerm={f('give_arrears_after_probation')}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Asset Deduction ──────────────────────────────────────────────── */}
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
