'use client';
import { useState } from 'react';

const FAQS: { q: string; a: string }[] = [
  { q: 'How long does the hiring process take?', a: 'Most candidates move from application to offer within 2–4 weeks, depending on interview scheduling and the number of rounds.' },
  { q: 'Can I reschedule my interview?', a: 'Yes. Open the Interviews page and use "Request reschedule". Share a reason and your preferred slot — HR will confirm a new time.' },
  { q: 'Who sees my documents and personal data?', a: 'Only the hiring team and HR at the company you applied to. Your data is used solely for this recruitment process.' },
  { q: 'What happens after I accept the offer?', a: 'You will be asked to complete the pre-joining form. After that, HR prepares your onboarding and your portal data migrates to Employee Self-Service on your joining date.' },
  { q: 'When does this portal close?', a: 'The portal stays open through your first week after joining, then read-only access ends and everything moves to Employee Self-Service.' },
  { q: 'How do I negotiate or ask about compensation?', a: 'Reply to your recruiter’s email or contact HR directly — compensation discussions happen over email so there is a written record.' },
  { q: 'What should I bring on joining day?', a: 'A government photo ID, your education and experience certificates, bank details, and passport-size photos. HR will send an exact checklist before your start date.' },
  { q: 'Is relocation support available?', a: 'Relocation assistance depends on the role and location. Ask your recruiter — if applicable, details will be included in your offer.' },
];

export default function PortalFaq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <h1 className="pc-h1">FAQ</h1>
      <div className="pc-lead">Common questions about the hiring process.</div>

      {FAQS.map((f, i) => (
        <div key={i} className="pc-card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
              padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13.5, fontWeight: 700, color: '#0f1623', textAlign: 'left',
            }}
          >
            {f.q}
            <span style={{ color: '#94a3b8', transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
          </button>
          {open === i && (
            <div style={{ padding: '0 20px 16px', fontSize: 12.5, color: '#475569', lineHeight: 1.7 }}>{f.a}</div>
          )}
        </div>
      ))}
    </>
  );
}
