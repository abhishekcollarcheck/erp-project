'use client';
import { useFormContext } from 'react-hook-form';
import { FormSection } from '@/components/form/FormSection';

const DOCS = [
  { name: 'offer_letter',           label: 'Offer Letter',           desc: 'Signed offer letter from employee' },
  { name: 'address_verification',   label: 'Address Verification',   desc: 'Utility bill / Aadhaar address proof' },
  { name: 'service_agreement',      label: 'Service Agreement',       desc: 'Employment contract signed' },
  { name: 'indemnity_bond',         label: 'Indemnity Bond',         desc: 'Signed indemnity / surety bond' },
  { name: 'asset_deduction_letter', label: 'Asset Deduction Letter', desc: 'Letter authorising asset deductions from salary' },
  { name: 'account_opening_letter', label: 'Account Opening Letter', desc: 'Bank account opening authorisation letter' },
  { name: 'nda',                    label: 'Non-Disclosure Agreement',desc: 'NDA signed by employee' },
] as const;

interface Props { isEdit: boolean; employeeId: number | null }

export function StepHrJoiningChecklist(_: Props) {
  const { register, watch } = useFormContext();
  const values = watch();
  const complete = DOCS.filter(d => values[d.name]).length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--r)' }}>
        Exit / resignation fields appear only when Status is On Notice, Relieved, Absconded, or Inactive. Company transfers are done from the employee directory via <strong>Transfer</strong>.
      </div>

      <div style={{ fontSize: 13, fontWeight: 600 }}>
        Joining Letters
        <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 11, color: 'var(--ink4)' }}>{complete} / {DOCS.length} confirmed</span>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--ink4)' }}>
          <span>✓</span><span>Document</span><span>Status</span>
        </div>
        {DOCS.map(doc => {
          const checked = !!values[doc.name];
          return (
            <label key={doc.name} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 8, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <input type="checkbox" {...register(doc.name)} style={{ width: 18, height: 18, accentColor: 'var(--blue)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{doc.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{doc.desc}</div>
              </div>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: checked ? 'var(--green-lt)' : 'var(--surface3)', color: checked ? 'var(--green)' : 'var(--ink4)', fontWeight: 500 }}>
                {checked ? '✓ Received' : 'Pending'}
              </span>
            </label>
          );
        })}
      </div>

      <div className="fg">
        <label>Remarks If Any</label>
        <input type="text" placeholder="Optional notes" {...register('remarks')} />
      </div>

      {complete < DOCS.length && (
        <div style={{ fontSize: 12, color: 'var(--amber)', padding: '8px 12px', background: 'var(--amber-lt)', borderRadius: 'var(--r)', border: '1px solid var(--amber-bd)' }}>
          ⚠️ {DOCS.length - complete} document(s) still pending. Portal access will be enabled automatically once Offer Letter, Address Verification, and Service Agreement are confirmed.
        </div>
      )}
    </div>
  );
}
