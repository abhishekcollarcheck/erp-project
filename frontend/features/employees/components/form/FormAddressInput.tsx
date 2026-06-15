'use client';
import { useFormContext } from 'react-hook-form';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';

interface Props {
  // Prefix for field names — e.g. 'present' → present_house_no, present_city, etc.
  prefix:      'present' | 'permanent' | string;
  label?:      string;
  required?:   boolean;
  disabled?:   boolean;
  showHouseType?: boolean;
  fieldPerm?:  { can_view?: boolean; can_edit?: boolean };
}

const HOUSE_TYPES = [
  { value: 'Own',  label: 'Own'  },
  { value: 'Rent', label: 'Rent' },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
].map(s => ({ value: s, label: s }));

export function FormAddressInput({
  prefix, label, required, disabled, showHouseType = true, fieldPerm,
}: Props) {
  const p = (field: string) => `${prefix}_${field}`;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
          {label}
          {required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
        </div>
      )}

      {/* House type + House no */}
      <div style={{ display: 'grid', gridTemplateColumns: showHouseType ? '140px 1fr' : '1fr', gap: 12 }}>
        {showHouseType && (
          <FormSelect
            name={p('house_type')}
            label="House Type"
            options={HOUSE_TYPES}
            placeholder="Select"
            required={required}
            disabled={disabled}
            fieldPerm={fieldPerm}
          />
        )}
        <FormInput
          name={p('house_no')}
          label="House / Flat No."
          placeholder="e.g. Flat 4B, Sunrise Towers"
          required={required}
          disabled={disabled}
          fieldPerm={fieldPerm}
        />
      </div>

      {/* Area / Street */}
      <FormInput
        name={p('area')}
        label="Area / Street / Village"
        placeholder="e.g. Andheri West, Near Station"
        disabled={disabled}
        fieldPerm={fieldPerm}
      />

      {/* District + City */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormInput
          name={p('district')}
          label="District"
          placeholder="e.g. Mumbai Suburban"
          required={required}
          disabled={disabled}
          fieldPerm={fieldPerm}
        />
        <FormInput
          name={p('city')}
          label="City"
          placeholder="e.g. Mumbai"
          required={required}
          disabled={disabled}
          fieldPerm={fieldPerm}
        />
      </div>

      {/* State + Country + Pin */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 }}>
        <FormSelect
          name={p('state')}
          label="State"
          options={INDIAN_STATES}
          placeholder="Select state"
          required={required}
          disabled={disabled}
          fieldPerm={fieldPerm}
        />
        <FormInput
          name={p('country')}
          label="Country"
          placeholder="India"
          required={required}
          disabled={disabled}
          fieldPerm={fieldPerm}
        />
        <FormInput
          name={p('pincode')}
          label="Pin Code"
          placeholder="400058"
          maxLength={6}
          required={required}
          disabled={disabled}
          fieldPerm={fieldPerm}
        />
      </div>
    </div>
  );
}
