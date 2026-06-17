'use client';
import { useWatch } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { SectionTitle } from '../../../../components/form/SectionTitle';
import { toOpts, HOUSE_TYPE, PERM_ADDRESS_TYPE } from '../../constants/employee.constants';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepAddress(_: Props) {
  const permType = useWatch({ name: 'perm_address_type' });
  const isOther  = permType === 'Other';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionTitle title="Present Address" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="present_house_type" label="House Type" required options={toOpts(HOUSE_TYPE)} placeholder="Own or Rent" />
        <FormInput  name="present_house_no"   label="House No." required placeholder="Flat 4B, Building XYZ" />
      </div>
      <FormInput name="present_area" label="Area / Village / Street" placeholder="Andheri West" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="present_district" label="District" required placeholder="Mumbai" />
        <FormInput name="present_city"     label="City"     required placeholder="Mumbai" />
        <FormInput name="present_state"    label="State"    required placeholder="Maharashtra" />
        <FormInput name="present_country"  label="Country"  required placeholder="India" />
      </div>
      <FormInput name="present_pincode" label="Pin Code" required placeholder="400058" maxLength={6} />

      <SectionTitle title="Permanent Address" />
      <FormSelect name="perm_address_type" label="Permanent Address Type" required options={toOpts(PERM_ADDRESS_TYPE)} />

      {isOther && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormSelect name="perm_house_type" label="House Type" options={toOpts(HOUSE_TYPE)} placeholder="Own or Rent" />
            <FormInput  name="perm_house_no"   label="House No." placeholder="Flat / Door No." />
          </div>
          <FormInput name="perm_area" label="Area / Village" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <FormInput name="perm_district" label="District" />
            <FormInput name="perm_city"     label="City" />
            <FormInput name="perm_state"    label="State" />
            <FormInput name="perm_country"  label="Country" />
          </div>
          <FormInput name="perm_pincode" label="Pin Code" maxLength={6} />
        </>
      )}
      {!isOther && permType && (
        <div style={{ padding: '10px 14px', background: 'var(--blue-lt)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--blue)' }}>
          ✓ Permanent address is same as present address
        </div>
      )}
    </div>
  );
}
