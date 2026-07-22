'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { WORKING_SITE_OPTIONS, WORKING_CITY_OPTIONS, WORKING_STATE_COUNTRY_OPTIONS, REGISTRATION_LOCATION_OPTIONS, SATURDAY_OFF_OPTIONS, SHIFT_TIMING_OPTIONS } from "../../constants/employee.constants"
import { FormSection } from '../../../../components/form/FormSection';
import { useShifts } from '../../../../features/shift/hooks/useShift';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepEmployment({ }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);
  const { data: shiftOptions = [], isLoading: shiftsLoading } = useShifts();

  return (
    <FormSection fields={[f('working_site'), f('working_city'), f('working_state_country'), f('pay_register_location'), f('saturday_off'), f('shift_id'), f('grace_minutes')]}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect
            name="working_site"
            label="Working Site"
            required
            placeholder='Select'
            options={[...WORKING_SITE_OPTIONS]}
            fieldPerm={f('working_site')}
          />
          <FormSelect
            name="working_city"
            label="Working City"
            required
            placeholder='Select'
            options={[...WORKING_CITY_OPTIONS]}
            fieldPerm={f('working_city')}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect
            name="working_state_country"
            label="Working State / Country"
            required
            placeholder='Select'
            options={[...WORKING_STATE_COUNTRY_OPTIONS]}
            fieldPerm={f('working_state_country')}
          />
          <FormSelect
            name="pay_register_location"
            label="Pay Register Location"
            required
            placeholder='Select'
            options={[...REGISTRATION_LOCATION_OPTIONS]}
            fieldPerm={f('pay_register_location')}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormSelect
            name="saturday_off"
            label="Saturday Off"
            required
            placeholder='Select'
            options={[...SATURDAY_OFF_OPTIONS]}
            fieldPerm={f('saturday_off')}
          />
          <FormSelect
            name="shift_id"
            label="Working Shift"
            required
            placeholder={shiftsLoading ? 'Loading shifts…' : 'Select'}
            options={shiftOptions}
            fieldPerm={f('shift_id')}
          />
          <FormInput name="grace_minutes" label="Grace (Minutes)" type="number" hint="Allowed late arrival in minutes" fieldPerm={f('grace_minutes')} />
        </div>
      </div>
    </FormSection>
  );
}
