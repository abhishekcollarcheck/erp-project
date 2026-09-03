'use client';

import { useEffect } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import { FormToggle } from '../../../../components/form/FormToggle';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import {
  toOpts,
  COMMITMENT_TERM,
  PROBATION_PERIOD,
  PROBATION_STATUS,
} from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props {
  isEdit: boolean;
  employeeId: number | null;
}

// ─── Pure compute helper ──────────────────────────────────────────────────────
// Examples:
// "36 Months" → 36 months
// "6 Months"  → 6 months
// "N/A"       → null
function addMonths(dateStr: string, termStr: string): string | null {
  if (!dateStr || !termStr || termStr === 'N/A') return null;

  const months = parseInt(termStr, 10);

  if (isNaN(months) || months <= 0) return null;

  const d = new Date(dateStr);

  if (isNaN(d.getTime())) return null;

  d.setMonth(d.getMonth() + months);

  return d.toISOString().split('T')[0];
}

export function StepCommitmentProbation(_: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  const { setValue } = useFormContext();

  const commitment = useWatch({
    name: 'commitment',
  });

  const commitmentTerm = useWatch({
    name: 'commitment_term',
  });

  const commitmentEnteredOn = useWatch({
    name: 'commitment_entered_on',
  });

  const onProbation = useWatch({
    name: 'on_probation',
  });

  const probationPeriod = useWatch({
    name: 'probation_period',
  });

  // Set in Location & Attendance step
  const actualDoj = useWatch({
    name: 'actual_doj',
  });

  // Set in Exit step, if the employee has exited — drives commitment_status below.
  // ASSUMPTION: field name matches EmployeeExit.last_working_day in employee.types.ts.
  // Confirm this is correct — if the exit form uses a different field name/path,
  // this computation will silently always take the "still active" branch.
  const exitLastWorkingDay = useWatch({
    name: 'exit.last_working_day',
  });

  // ─── Commitment Status (display-only — no backend column, never submitted) ──
  // Mirrors the source spreadsheet formula:
  // - No commitment            → "N/A"
  // - Term/entered-on missing  → "" (can't compute yet)
  // - Not yet exited           → "Under Commitment" if end date is future, else "Completed"
  // - Already exited           → "Bond Break" if they left before end date, else "Completed"
  function computeCommitmentStatus(): string {
    if (!commitment) return 'N/A';
    if (!commitmentTerm || !commitmentEnteredOn) return '';

    const end = addMonths(commitmentEnteredOn, commitmentTerm);
    if (!end) return '';

    const endDate = new Date(end);

    if (!exitLastWorkingDay) {
      return endDate > new Date() ? 'Under Commitment' : 'Completed';
    }

    return endDate > new Date(exitLastWorkingDay)
      ? 'Bond Break'
      : 'Completed';
  }

  const commitmentStatus = computeCommitmentStatus();

  // ─── Commitment End Date ────────────────────────────────────────────────────
  useEffect(() => {
    if (!commitment) {
      setValue('commitment_end_date', null, {
        shouldDirty: false,
      });

      return;
    }

    const result = addMonths(
      commitmentEnteredOn,
      commitmentTerm,
    );

    setValue(
      'commitment_end_date',
      result ?? null,
      {
        shouldDirty: false,
      },
    );
  }, [
    commitment,
    commitmentEnteredOn,
    commitmentTerm,
    setValue,
  ]);

  // ─── Probation End Date ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!onProbation) {
      setValue('probation_end_date', null, {
        shouldDirty: false,
      });

      return;
    }

    const result = addMonths(
      actualDoj,
      probationPeriod,
    );

    setValue(
      'probation_end_date',
      result ?? null,
      {
        shouldDirty: false,
      },
    );
  }, [
    onProbation,
    actualDoj,
    probationPeriod,
    setValue,
  ]);

  return (
    <FormSection
      fields={[
        f('commitment'),
        f('commitment_term'),
        f('commitment_entered_on'),
        f('commitment_end_date'),

        f('on_probation'),
        f('probation_period'),
        f('probation_end_date'),
        f('probation_status'),
      ]}
    >
      <div
        style={{
          display: 'grid',
          gap: 16,
        }}
      >

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Commitment / Bond */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink3)',
          }}
        >
          Commitment / Bond
        </div>

        <FormToggle
          name="commitment"
          label="Has Commitment Bond"
          showValue
          fieldPerm={f('commitment')}
        />

        {commitment && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 12,
            }}
          >
            <FormSelect
              name="commitment_term"
              label="Commitment Term"
              options={toOpts(COMMITMENT_TERM)}
              placeholder="Select term"
              fieldPerm={f('commitment_term')}
            />

            <FormDatePicker
              name="commitment_entered_on"
              label="Commitment Entered On"
              disableFuture
              fieldPerm={f('commitment_entered_on')}
            />

            <FormDatePicker
              name="commitment_end_date"
              label="Commitment End Date"
              disabled
              hint="Auto-calculated: entered date + term"
              fieldPerm={f('commitment_end_date')}
            />

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                Commitment Status
              </div>

              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border, #ddd)',
                  background: 'var(--surface2, #f5f5f5)',
                  color: 'var(--ink2, #555)',
                  fontSize: 14,
                }}
              >
                {commitmentStatus || '—'}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--ink3)',
                  marginTop: 4,
                }}
              >
                Auto-calculated — not saved as a separate field
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* Probation */}
        {/* ─────────────────────────────────────────────────────────────────── */}

        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink3)',
          }}
        >
          Probation
        </div>

        <FormToggle
          name="on_probation"
          label="On Probation"
          showValue
          fieldPerm={f('on_probation')}
        />

        {onProbation && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
            }}
          >
            <FormSelect
              name="probation_period"
              label="Probation Period"
              options={toOpts(PROBATION_PERIOD)}
              placeholder="Select period"
              fieldPerm={f('probation_period')}
            />

            <FormDatePicker
              name="probation_end_date"
              label="Probation End Date"
              disabled
              hint={
                actualDoj
                  ? 'Auto-calculated: DOJ + period'
                  : 'Set Date of Joining in Location & Attendance step first'
              }
              fieldPerm={f('probation_end_date')}
            />

            <FormSelect
              name="probation_status"
              label="Probation Status"
              options={toOpts(PROBATION_STATUS)}
              placeholder="Select status"
              fieldPerm={f('probation_status')}
            />
          </div>
        )}

      </div>
    </FormSection>
  );
}