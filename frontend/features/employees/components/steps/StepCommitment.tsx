'use client';
import { useWatch } from 'react-hook-form';
import { FormToggle } from '../../components/form/FormToggle';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { FormInput } from '../../../../components/form/FormInput';
import { SectionTitle } from '../../components/form/SectionTitle';
import { toOpts, COMMITMENT_TERM, CONFIRMATION_STATUS } from '../../constants/employee.constants';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepCommitment(_: Props) {
  const commitment  = useWatch({ name: 'commitment' });
  const on_probation = useWatch({ name: 'on_probation' });

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Commitment" />
      <FormToggle name="commitment" label="Has Commitment Bond" />
      {commitment && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormSelect name="commitment_term" label="Commitment Term" options={toOpts(COMMITMENT_TERM)} placeholder="Select term" />
          <FormDatePicker name="commitment_entered_on" label="Commitment Entered On" />
          <div className="form-field">
            <label className="field-label">Commitment End Date</label>
            <input type="text" className="form-input readonly" readOnly value="Auto-computed" />
            <p className="field-hint">Calculated from term + entered date</p>
          </div>
        </div>
      )}

      <SectionTitle title="Probation Details" />
      <FormToggle name="on_probation" label="On Probation" />
      {on_probation && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormInput name="probation_period" label="Probation Period" placeholder="e.g. 3 Months" />
          <div className="form-field">
            <label className="field-label">Probation End Date</label>
            <input type="text" className="form-input readonly" readOnly value="Auto-computed" />
            <p className="field-hint">Calculated from DOJ + period</p>
          </div>
          <FormInput name="probation_extended_period" label="Extended Period (if any)" />
        </div>
      )}

      <SectionTitle title="Confirmation" subtitle="Fill after probation period ends" />
      <FormSelect name="confirmation_status" label="Confirmation Status" options={toOpts(CONFIRMATION_STATUS)} placeholder="Pending — fill after probation" />
      <FormDatePicker name="confirmed_on" label="Confirmed On" />
    </div>
  );
}
