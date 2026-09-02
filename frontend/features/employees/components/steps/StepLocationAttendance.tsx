'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { WORKING_SITE_OPTIONS, WORKING_CITY_OPTIONS, WORKING_STATE_COUNTRY_OPTIONS, REGISTRATION_LOCATION_OPTIONS, WEEKLY_OFF_OPTIONS, GRACE_MINUTES_OPTIONS } from "../../constants/employee.constants"
import { FormSection } from '../../../../components/form/FormSection';
import { useShifts } from '../../../../features/shift/hooks/useShift';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepLocationAttendance({ }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { data: shiftOptions = [], isLoading: shiftsLoading } = useShifts();

  return (
    <FormSection fields={[f('working_state_country'), f('working_city'), f('working_site'), f('pay_register_location'), f('actual_doj'), f('weekly_off'), f('shift_category'), f('shift_id'), f('grace_minutes')]}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)', marginTop: -4 }}>Work Location</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect
            name="working_state_country"
            label="State / Country"
            placeholder='Select'
            options={[...WORKING_STATE_COUNTRY_OPTIONS]}
            fieldPerm={f('working_state_country')}
          />
          <FormSelect
            name="working_city"
            label="City"
            placeholder='Select'
            options={[...WORKING_CITY_OPTIONS]}
            fieldPerm={f('working_city')}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect
            name="working_site"
            label="Working Site"
            placeholder='Select'
            options={[...WORKING_SITE_OPTIONS]}
            fieldPerm={f('working_site')}
          />
          <FormSelect
            name="pay_register_location"
            label="Pay Register Location"
            placeholder='Select'
            options={[...REGISTRATION_LOCATION_OPTIONS]}
            fieldPerm={f('pay_register_location')}
          />
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Joining</div>
        <FormDatePicker name="actual_doj" label="Date of Joining" required max={new Date().toISOString().split('T')[0]} fieldPerm={f('actual_doj')} />

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Shift &amp; Weekly Off</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          <FormSelect
            name="weekly_off"
            label="Weekly Off"
            placeholder='Select'
            options={[...WEEKLY_OFF_OPTIONS]}
            fieldPerm={f('weekly_off')}
          />
          <FormSelect
            name="shift_category"
            label="Shift Category"
            placeholder='Select'
            options={[
              { value: 'Shift', label: 'Shift' },
              { value: 'Duration', label: 'Duration' },
            ]}
            fieldPerm={f('shift_category')}
          />
          <FormSelect
            name="shift_id"
            label="Working Shift"
            placeholder={shiftsLoading ? 'Loading shifts…' : 'Select'}
            options={shiftOptions}
            fieldPerm={f('shift_id')}
          />
          <FormSelect
            name="grace_minutes"
            label="Grace Minutes"
            placeholder='Select'
            options={[...GRACE_MINUTES_OPTIONS]}
            fieldPerm={f('grace_minutes')}
          />
        </div>
      </div>
    </FormSection>
  );
}