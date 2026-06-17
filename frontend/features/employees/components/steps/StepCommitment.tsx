'use client';
import { useEffect } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import { FormToggle }      from '../../../../components/form/FormToggle';
import { FormSelect }      from '../../../../components/form/FormSelect';
import { FormDatePicker }  from '../../../../components/form/FormDatePicker';
import { SectionTitle }    from '../../../../components/form/SectionTitle';
import {
  toOpts,
  COMMITMENT_TERM,
  PROBATION_PERIOD,
  CONFIRMATION_STATUS,
} from '../../constants/employee.constants';

interface Props { isEdit: boolean; employeeId: number | null }

// ─── Pure compute helpers (mirrors employees.helper.ts on backend) ─────────────
function addMonths(dateStr: string, termStr: string): string | null {
  if (!dateStr || !termStr || termStr === 'N/A') return null;
  const months = parseInt(termStr, 10); // "36 Months" → 36, "3 Months" → 3
  if (isNaN(months) || months <= 0) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  // Return YYYY-MM-DD — matches <input type="date"> format
  return d.toISOString().split('T')[0];
}

export function StepCommitment(_: Props) {
  const { setValue } = useFormContext();

  // ── Source fields ────────────────────────────────────────────────────────────
  const commitment          = useWatch({ name: 'commitment' });
  const commitment_term     = useWatch({ name: 'commitment_term' });
  const commitment_entered_on = useWatch({ name: 'commitment_entered_on' });

  const on_probation   = useWatch({ name: 'on_probation' });
  const probation_period = useWatch({ name: 'probation_period' });
  const actual_doj     = useWatch({ name: 'actual_doj' }); // set in StepReporting

  // ── Auto-compute commitment_end_date ──────────────────────────────────────────
  useEffect(() => {
    if (!commitment) {
      setValue('commitment_end_date', null, { shouldDirty: false });
      return;
    }
    const result = addMonths(commitment_entered_on, commitment_term);
    setValue('commitment_end_date', result ?? null, { shouldDirty: false });
  }, [commitment, commitment_entered_on, commitment_term, setValue]);

  // ── Auto-compute probation_end_date ───────────────────────────────────────────
  useEffect(() => {
    if (!on_probation) {
      setValue('probation_end_date', null, { shouldDirty: false });
      return;
    }
    const result = addMonths(actual_doj, probation_period);
    setValue('probation_end_date', result ?? null, { shouldDirty: false });
  }, [on_probation, actual_doj, probation_period, setValue]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* ── Commitment Bond ────────────────────────────────────────────────── */}
      <SectionTitle title="Commitment Bond" />
      <FormToggle name="commitment" label="Has Commitment Bond" showValue />

      {commitment && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormSelect
            name="commitment_term"
            label="Commitment Term"
            options={toOpts(COMMITMENT_TERM)}
            placeholder="Select term"
          />
          <FormDatePicker
            name="commitment_entered_on"
            label="Commitment Entered On"
            disableFuture
          />
          {/* Read-only computed field — registered in RHF via FormDatePicker */}
          <FormDatePicker
            name="commitment_end_date"
            label="Commitment End Date"
            disabled
            hint="Auto-calculated: entered date + term"
          />
        </div>
      )}

      {/* ── Probation ─────────────────────────────────────────────────────── */}
      <SectionTitle title="Probation Details" />
      <FormToggle name="on_probation" label="On Probation" showValue />

      {on_probation && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormSelect
            name="probation_period"
            label="Probation Period"
            options={toOpts(PROBATION_PERIOD)}
            placeholder="Select period"
          />
          {/* Read-only computed field — registered in RHF via FormDatePicker */}
          <FormDatePicker
            name="probation_end_date"
            label="Probation End Date"
            disabled
            hint={actual_doj ? 'Auto-calculated: DOJ + period' : 'Set Actual DOJ in Reporting step first'}
          />
          <FormSelect
            name="probation_extended_period"
            label="Extended Period (if any)"
            options={toOpts(PROBATION_PERIOD)}
            placeholder="None"
          />
        </div>
      )}

      {/* ── Confirmation ──────────────────────────────────────────────────── */}
      <SectionTitle
        title="Confirmation"
        subtitle="Fill after probation period ends"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect
          name="confirmation_status"
          label="Confirmation Status"
          options={toOpts(CONFIRMATION_STATUS)}
          placeholder="Pending — fill after probation"
        />
        <FormDatePicker name="confirmed_on" label="Confirmed On" />
      </div>

    </div>
  );
}