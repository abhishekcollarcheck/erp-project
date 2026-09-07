'use client';
import { VIEW_STAGE_STEPS, STATUS_TO_VIEW_STEP, type CandidateStatus } from '../../types/candidate.types';
import { formatDate } from '../../../../utils/formatters';

interface Props {
  status: CandidateStatus;
  createdAt?: string | null;
  compact?: boolean;
}

/** Condensed 5-step candidate journey: Applied → Shortlisted → Interview → Offer → Hired. */
export function PortalStepper({ status, createdAt, compact }: Props) {
  const active = STATUS_TO_VIEW_STEP[status] ?? -1;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {VIEW_STAGE_STEPS.map((step, idx) => {
        const done = active > idx;
        const curr = active === idx;
        return (
          <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', textAlign: 'center' }}>
            {idx < VIEW_STAGE_STEPS.length - 1 && (
              <span style={{
                position: 'absolute', left: '50%', top: 13, width: '100%', height: 2,
                background: done ? '#1e56d9' : '#dfe4ec', zIndex: 0,
              }} />
            )}
            <span style={{
              position: 'relative', zIndex: 1, width: 26, height: 26, borderRadius: '50%',
              border: `2px solid ${done ? '#1e56d9' : curr ? '#1e56d9' : '#dfe4ec'}`,
              background: done ? '#1e56d9' : curr ? '#eef3fd' : '#fff',
              color: done ? '#fff' : curr ? '#1e56d9' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
            }}>
              {done ? '✓' : idx + 1}
            </span>
            <span style={{
              marginTop: 6, fontSize: compact ? 9 : 11, lineHeight: 1.3,
              fontWeight: curr ? 800 : 600, color: done || curr ? '#0f1623' : '#94a3b8',
            }}>
              {step}
            </span>
            <span style={{ fontSize: compact ? 8 : 10, color: '#94a3b8', marginTop: 1 }}>
              {idx === 0 ? (createdAt ? formatDate(createdAt) : 'Applied') : done ? 'Done' : curr ? 'Now' : 'Pending'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
