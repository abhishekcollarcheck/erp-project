'use client';
import { useRouter } from 'next/navigation';
import { usePortalProfile } from '../../../../features/candidates/hooks/usePortal';
import { formatDate } from '../../../../utils/formatters';

export default function PortalJoiningFormPage() {
  const router = useRouter();
  const { data: c } = usePortalProfile();
  if (!c) return null;

  const sent = !!c.pre_joining_form_sent;
  const status = c.prejoining_form_status || 'Not_Started';
  const submitted = status === 'Submitted';
  const draft = status === 'Draft';

  return (
    <>
      <h1 className="pc-h1">Joining Form</h1>
      <div className="pc-lead">Pre-joining &amp; personal data form — completed after you accept your offer.</div>

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
              You submitted your joining form{c.prejoining_submitted_at ? ` on ${formatDate(c.prejoining_submitted_at)}` : ''}.
              HR will use it to prepare your onboarding. You can open it to review your answers.
            </p>
            <button className="pc-btn pc-btn-sec" style={{ marginTop: 12 }} onClick={() => router.push('/portal/prejoining')}>
              View submitted form
            </button>
          </>
        ) : sent ? (
          <>
            <p className="pc-muted" style={{ lineHeight: 1.7 }}>
              {draft
                ? 'You have a saved draft — pick up where you left off. Use "Save draft" any time to keep your progress.'
                : 'Complete this multi-step form to finalise your onboarding. It covers personal details, address, education, employment history, statutory information, family and references. Use "Save draft" to continue later.'}
            </p>
            <button className="pc-btn pc-btn-pri" style={{ marginTop: 12 }} onClick={() => router.push('/portal/prejoining')}>
              {draft ? 'Continue form →' : 'Start form →'}
            </button>
          </>
        ) : (
          <div className="pc-empty" style={{ marginTop: 4 }}>
            This form becomes available once your offer is issued. You&rsquo;ll get an email when it&rsquo;s ready — it will also appear here.
          </div>
        )}
      </div>

      <div className="pc-card" style={{ background: '#eef3fd', borderColor: '#c7d9fb', fontSize: 12, color: '#1e56d9' }}>
        After you join, the details you provide here migrate to <strong>Employee Self-Service → My Profile</strong>.
      </div>
    </>
  );
}
