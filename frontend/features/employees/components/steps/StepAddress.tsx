'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { toOpts, HOUSE_TYPE, PERM_ADDRESS_TYPE, WORKING_CITY_OPTIONS, WORKING_STATE_COUNTRY_OPTIONS } from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepAddress(_: Props) {
  const permType = useWatch({ name: 'perm_address_type' });
  const isDifferent = permType === 'Different';

  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  return (
    <FormSection fields={[f('present_house_type'), f('present_house_no'), f('present_area'), f('present_district'), f('present_city'), f('present_state'), f('present_country'), f('present_pincode'), f('perm_address_type'), f('perm_house_type'), f('perm_area'), f('perm_district'), f('perm_city'), f('perm_state'), f('perm_country'), f('perm_pincode')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Present Address</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="present_house_type" label="House Type" options={toOpts(HOUSE_TYPE)} placeholder="Select" fieldPerm={f('present_house_type')} />
        <FormInput  name="present_house_no"   label="House No" placeholder="Flat 4B, Building XYZ" fieldPerm={f('present_house_no')} />
      </div>
      <FormInput name="present_area" label="Area / Village / Block / Street No." placeholder="Andheri West" fieldPerm={f('present_area')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="present_district" label="District" placeholder="Mumbai" fieldPerm={f('present_district')} />
        <FormSelect name="present_country" label="Country" options={[{ value: 'India', label: 'India' }, { value: 'Bangladesh', label: 'Bangladesh' }, { value: 'Nepal', label: 'Nepal' }, { value: 'Other', label: 'Other' }]} placeholder="Select" fieldPerm={f('present_country')} />
        <FormSelect name="present_state" label="State" options={[...WORKING_STATE_COUNTRY_OPTIONS]} placeholder="Select" fieldPerm={f('present_state')} />
        <FormSelect name="present_city" label="City" options={[...WORKING_CITY_OPTIONS]} placeholder="Select" fieldPerm={f('present_city')} />
      </div>
      <FormInput name="present_pincode" label="Pin Code" type="number" placeholder="400058" fieldPerm={f('present_pincode')} />

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Permanent Address</div>
      <FormSelect name="perm_address_type" label="Permanent Address" options={toOpts(PERM_ADDRESS_TYPE)} placeholder="Select" fieldPerm={f('perm_address_type')} />

      {isDifferent && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormSelect name="perm_house_type" label="House Type" options={toOpts(HOUSE_TYPE)} placeholder="Select" fieldPerm={f('perm_house_type')} />
            <FormInput  name="perm_house_no"   label="House No." placeholder="Flat / Door No." fieldPerm={f('perm_house_no')} />
          </div>
          <FormInput name="perm_area" label="Area / Village" fieldPerm={f('perm_area')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <FormInput name="perm_district" label="District" fieldPerm={f('perm_district')} />
            <FormInput name="perm_country"  label="Country" fieldPerm={f('perm_country')} />
            <FormInput name="perm_state"    label="State" fieldPerm={f('perm_state')} />
            <FormInput name="perm_city"     label="City" fieldPerm={f('perm_city')} />
          </div>
          <FormInput name="perm_pincode" label="Pin Code" fieldPerm={f('perm_pincode')} />
        </>
      )}
      {permType === 'Same as Present' && (
        <div style={{ padding: '10px 14px', background: 'var(--blue-lt)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--blue)' }}>
          ✓ Permanent address is same as present address
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Choose whether permanent address is the same as present, different, or not applicable.</div>
    </div>
    </FormSection>
  );
}
