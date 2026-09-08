'use client';
import { usePortalProfile } from '../../../../features/candidates/hooks/usePortal';
import { PortalStepper } from '../../../../features/candidates/components/portal/PortalStepper';
import {
  VIEW_STAGE_STEPS, STATUS_TO_VIEW_STEP,
  type CandidateStatus,
} from '../../../../features/candidates/types/candidate.types';
import { formatDate } from '../../../../utils/formatters';

const TERMINAL: Record<string, string> = {
  Rejected: 'This application has been closed. Thank you for your interest.',
  Withdrawn: 'This application has been withdrawn.',
  On_Hold: 'Your application is currently on hold — HR will be in touch.',
};

export default function PortalProgress() {
  const { data: c } = usePortalProfile();
  if (!c) return null;

  const active = STATUS_TO_VIEW_STEP[c.status as CandidateStatus] ?? -1;
  const terminalMsg = TERMINAL[c.status];

  return (
    <>
      <h1 className="pc-h1">My progress</h1>
      <div className="pc-lead">Where you are in the hiring process — from applied to hired.</div>

      <div className="pc-card">
        <PortalStepper status={c.status as CandidateStatus} createdAt={c.created_at} />
      </div>

      {terminalMsg && (
        <div className="pc-card" style={{ background: '#fff8ed', borderColor: '#f9dbaf', color: '#b93815', fontSize: 13, fontWeight: 600 }}>
          {terminalMsg}
        </div>
      )}

      <div className="pc-card">
        <div className="pc-ct">Stage by stage</div>
        {VIEW_STAGE_STEPS.map((step, idx) => {
          const done = active > idx;
          const curr = active === idx;
          const badge = done ? 'Done' : curr ? 'Current' : 'Upcoming';
          const tone = done ? { bg: '#ecfdf3', fg: '#067647', bd: '#a6f0c6' }
            : curr ? { bg: '#eef3fd', fg: '#1e56d9', bd: '#c7d9fb' }
            : { bg: '#f1f5f9', fg: '#64748b', bd: '#e0e4ec' };
          return (
            <div key={step} className="pc-row" style={{ alignItems: 'center' }}>
              <span style={{
                fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '3px 10px',
                background: tone.bg, color: tone.fg, border: `1px solid ${tone.bd}`, flexShrink: 0, minWidth: 78, textAlign: 'center',
              }}>
                {badge}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {step}{idx === 0 && c.created_at ? ` · ${formatDate(c.created_at)}` : ''}
                </div>
                {curr && <div className="pc-muted" style={{ marginTop: 1 }}>You&rsquo;re here</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pc-muted">Typical timeline is 2–4 weeks.</div>
    </>
  );
}
