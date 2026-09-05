'use client';
import { useWatch, useFormContext } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { toOpts, PERM_ADDRESS_TYPE } from '../../constants/employee.constants';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';
import { useHouseTypeData } from '../../../house-type/hooks/useHouseType';
import { useCountries, useStates, useCities } from '../../../locations/hooks/uselocation';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepAddress(_: Props) {
  const { setValue, getValues } = useFormContext();
  const permType = useWatch({ name: 'perm_address_type' });

  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  const { data: houseTypes = [] } = useHouseTypeData();
  const { data: countries = [] } = useCountries();
  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCities();

  const copyFromPresent = () => {
    const v = getValues();
    setValue('perm_house_type', v.present_house_type, { shouldDirty: true });
    setValue('perm_house_no', v.present_house_no, { shouldDirty: true });
    setValue('perm_area', v.present_area, { shouldDirty: true });
    setValue('perm_district', v.present_district, { shouldDirty: true });
    setValue('perm_city', v.present_city, { shouldDirty: true });
    setValue('perm_state', v.present_state, { shouldDirty: true });
    setValue('perm_country', v.present_country, { shouldDirty: true });
    setValue('perm_pincode', v.present_pincode, { shouldDirty: true });
  };

  return (
    <FormSection fields={[f('present_house_type'), f('present_house_no'), f('present_area'), f('present_district'), f('present_city'), f('present_state'), f('present_country'), f('present_pincode'), f('perm_address_type'), f('perm_house_type'), f('perm_area'), f('perm_district'), f('perm_city'), f('perm_state'), f('perm_country'), f('perm_pincode')]}>
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Present Address</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="present_house_type" label="House Type" options={toOpts(houseTypes.map((h: any) => h.name))} placeholder="Select" fieldPerm={f('present_house_type')} />
        <FormInput  name="present_house_no"   label="House No" placeholder="Flat 4B, Building XYZ" fieldPerm={f('present_house_no')} />
      </div>
      <FormInput name="present_area" label="Area / Village / Block / Street No." placeholder="Andheri West" fieldPerm={f('present_area')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <FormInput name="present_district" label="District" placeholder="Mumbai" fieldPerm={f('present_district')} />
        <FormSelect name="present_country" label="Country" options={toOpts(countries.map((c: any) => c.name))} placeholder="Select" fieldPerm={f('present_country')} />
        <FormSelect name="present_state" label="State" options={toOpts(states.map((s: any) => s.name))} placeholder="Select" fieldPerm={f('present_state')} />
        <FormSelect name="present_city" label="City" options={toOpts(cities.map((c: any) => c.name))} placeholder="Select" fieldPerm={f('present_city')} />
      </div>
      <FormInput name="present_pincode" label="Pin Code" type="number" placeholder="400058" fieldPerm={f('present_pincode')} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>Permanent Address</div>
        {permType === 'Same as Present' && (
          <button type="button" className="btn btn-sec btn-sm" onClick={copyFromPresent}>Copy from Present Address</button>
        )}
      </div>
      <FormSelect name="perm_address_type" label="Permanent Address" options={toOpts(PERM_ADDRESS_TYPE)} placeholder="Select" fieldPerm={f('perm_address_type')} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormSelect name="perm_house_type" label="House Type" options={toOpts(houseTypes.map((h: any) => h.name))} placeholder="Select" fieldPerm={f('perm_house_type')} />
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
      <div style={{ fontSize: 11, color: 'var(--ink4)' }}>Both addresses are saved as entered. Pick "Same as Present" above, then use Copy to fill this section instantly.</div>
    </div>
    </FormSection>
  );
}