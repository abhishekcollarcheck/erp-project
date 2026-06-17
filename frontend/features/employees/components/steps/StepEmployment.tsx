'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormToggle } from '../../../../components/form/FormToggle';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { useFieldPermissions } from '../../hooks/useEmployees';
import { WORKING_SITE_OPTIONS, WORKING_CITY_OPTIONS, WORKING_STATE_COUNTRY_OPTIONS, REGISTRATION_LOCATION_OPTIONS, SATURDAY_OFF_OPTIONS, SHIFT_TIMING_OPTIONS } from "../../constants/employee.constants"

interface Props { isEdit: boolean; employeeId: number | null }

export function StepEmployment({ }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => fp?.[n];

  return (
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
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <FormSelect
          name="saturday_off"
          label="Saturday Off"
          required
          placeholder='Select'
          options={[...SATURDAY_OFF_OPTIONS]}
        />
        <FormSelect
          name="shift_id"
          label="Working Shift"
          required
          placeholder='Select'
          options={[...SHIFT_TIMING_OPTIONS]}
        />
        <FormInput name="grace_minutes" label="Grace (Minutes)" type="number" hint="Allowed late arrival in minutes" />
      </div>
    </div>
  );
}
