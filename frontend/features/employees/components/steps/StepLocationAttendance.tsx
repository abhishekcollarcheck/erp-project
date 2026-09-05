'use client';
import { FormInput } from '../../../../components/form/FormInput';
import { FormSelect } from '../../../../components/form/FormSelect';
import { FormDatePicker } from '../../../../components/form/FormDatePicker';
import { useFieldPermissions, resolveFieldPerm } from '../../hooks/useEmployees';
import { FormSection } from '../../../../components/form/FormSection';
import { useShiftOptions, useShifts } from '../../../../features/shift/hooks/useShift';
import { useWatch } from 'react-hook-form';
import { useStates, useCities, useSites, usePayRegisters } from '../../../locations/hooks/uselocation';
import { useWeeklyOffs } from '../../../weeklyoff/hooks/useWeeklyoff';
import { useGraceMinutesData } from '../../../attendance-rule/hooks/useAttendanceRules';

interface Props { isEdit: boolean; employeeId: number | null }

export function StepLocationAttendance({ }: Props) {
  const { data: fp } = useFieldPermissions();
  const f = (n: string) => resolveFieldPerm(fp, n);

  const shiftType = useWatch({
    name: 'shift_type',
  });

  const { data: shiftOptions = [], isLoading: shiftsLoading } = useShiftOptions();

  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCities();
  const { data: sites = [] } = useSites();
  const { data: payRegisters = [] } = usePayRegisters();
  const { data: weeklyOffs = [] } = useWeeklyOffs();
  const { data: graceMinutesResponse } = useGraceMinutesData();
  const graceMinutes = graceMinutesResponse?.data ?? [];

  const stateOpts = (states ?? []).map((s: any) => ({ value: s.id, label: s.name }));
  const cityOpts = (cities ?? []).map((c: any) => ({ value: c.id, label: c.name }));
  const siteOpts = (sites ?? []).map((s: any) => ({ value: s.id, label: s.name }));
  const payRegisterOpts = (payRegisters ?? []).map((p: any) => ({ value: p.id, label: p.name }));
  const weeklyOffOpts = (weeklyOffs ?? []).map((w: any) => ({ value: w.id, label: w.name }));
  const graceMinutesOpts = (graceMinutes ?? []).map((g: any) => ({ value: g.minutes, label: g.name }));


  return (
    <FormSection fields={[f('working_state_country'), f('working_city'), f('working_site'), f('pay_register_location'), f('actual_doj'), f('weekly_off'), f('shift_category'), f('shift_id'), f('grace_minutes')]}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink3)', marginTop: -4 }}>Work Location</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect
            name="working_state_country"
            label="State / Country"
            placeholder='Select'
            options={stateOpts}
            fieldPerm={f('working_state_country')}
          />
          <FormSelect
            name="working_city"
            label="City"
            placeholder='Select'
            options={cityOpts}
            fieldPerm={f('working_city')}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormSelect
            name="working_site"
            label="Working Site"
            placeholder='Select'
            options={siteOpts}
            fieldPerm={f('working_site')}
          />
          <FormSelect
            name="pay_register_location"
            label="Pay Register Location"
            placeholder='Select'
            options={payRegisterOpts}
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
            options={weeklyOffOpts}
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
            options={graceMinutesOpts}
            fieldPerm={f('grace_minutes')}
          />
        </div>
      </div>
    </FormSection>
  );
}