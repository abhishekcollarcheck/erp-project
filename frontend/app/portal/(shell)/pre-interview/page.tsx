'use client';
import { useRouter } from 'next/navigation';
import { usePortalProfile } from '../../../../features/candidates/hooks/usePortal';
import { formatDate } from '../../../../utils/formatters';

export default function PortalPreInterviewFormPage() {
  const router = useRouter();
  const { data: c } = usePortalProfile();
  if (!c) return null;

  const sent = !!c.pre_interview_form_sent;
  const status = c.preinterview_form_status || 'Not_Started';
  const submitted = status === 'Submitted';
  const draft = status === 'Draft';

  return (
    <>
      <h1 className="pc-h1">Pre-Interview Form</h1>
      <div className="pc-lead">Your declaration and personal details, collected before the interview round.</div>

      <div className="pc-card">
        <div className="pc-ct">
          Status
          <span className={`pc-chip ${submitted ? 'grn' : draft ? 'amb' : 'gry'}`}>
            {submitted ? 'Submitted' : draft ? 'Draft saved' : sent ? 'Not started' : 'Not shared yet'}
          </span>
        </div>

        {submitted ? (
          <>
            <p className="pc-muted" style={{ lineHeight: 1.7 }}>
              You submitted this form{c.preinterview_submitted_at ? ` on ${formatDate(c.preinterview_submitted_at)}` : ''}.
              Your recruiter is reviewing it. You can still open it to review your answers.
            </p>
            <button className="pc-btn pc-btn-sec" style={{ marginTop: 12 }} onClick={() => router.push('/portal/preinterview')}>
              View submitted form
            </button>
          </>
        ) : sent ? (
          <>
            <p className="pc-muted" style={{ lineHeight: 1.7 }}>
              {draft
                ? 'You have a saved draft — pick up where you left off. Use "Save draft" any time to keep your progress.'
                : 'Please complete this multi-step form before your interview. It covers personal details, address, family, references, health and a declaration. Use "Save draft" to continue later.'}
            </p>
            <button className="pc-btn pc-btn-pri" style={{ marginTop: 12 }} onClick={() => router.push('/portal/preinterview')}>
              {draft ? 'Continue form →' : 'Start form →'}
            </button>
          </>
        ) : (
          <div className="pc-empty" style={{ marginTop: 4 }}>
            Your recruiter hasn&rsquo;t shared this form yet. It becomes available once your interview is being set up — check back here or watch for an email.
          </div>
        )}
      </div>

      <div className="pc-card" style={{ background: '#eef3fd', borderColor: '#c7d9fb', fontSize: 12, color: '#1e56d9' }}>
        Your answers are visible only to the hiring team and are used solely for this recruitment process.
      </div>
    </>
  );
}
