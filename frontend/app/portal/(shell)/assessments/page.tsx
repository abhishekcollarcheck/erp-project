'use client';
import Link from 'next/link';
import { usePortalProfile } from '../../../../features/candidates/hooks/usePortal';
import { formatDate } from '../../../../utils/formatters';

export default function PortalAssessments() {
  const { data: c } = usePortalProfile();
  if (!c) return null;

  const assigned = !!c.aptitude_test_sent && !c.aptitude_attempted_at;
  const done = !!c.aptitude_attempted_at;
  const testId = c.aptitude_test_id ?? 1;

  return (
    <>
      <h1 className="pc-h1">Assessments</h1>
      <div className="pc-lead">Tests and exercises assigned by the hiring team.</div>

      {assigned ? (
        <div className="pc-card" style={{ borderColor: '#c7d9fb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Aptitude test assigned</div>
              <div className="pc-muted" style={{ maxWidth: 460, lineHeight: 1.6 }}>
                HR has assigned an aptitude assessment. Your score is <strong>not</strong> shown to you — HR reviews results privately.
              </div>
            </div>
            <Link href={`/portal/test/${testId}`} className="pc-btn pc-btn-pri">Start test →</Link>
          </div>
        </div>
      ) : done ? (
        <div className="pc-card" style={{ borderColor: '#a6f0c6' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#067647' }}>✓ Aptitude test completed on {formatDate(c.aptitude_attempted_at)}</div>
          <div className="pc-muted" style={{ marginTop: 4 }}>Results are being reviewed by HR and will be communicated to you.</div>
        </div>
      ) : (
        <div className="pc-empty">No assessments assigned yet.</div>
      )}
    </>
  );
}
