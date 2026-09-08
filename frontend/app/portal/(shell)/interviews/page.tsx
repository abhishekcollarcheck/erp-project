'use client';
import { useRef, useState } from 'react';
import {
  usePortalProfile, usePortalDocuments,
  usePortalRespondInterview, usePortalReschedule, usePortalSubmitAssignment,
} from '../../../../features/candidates/hooks/usePortal';
import { formatDate } from '../../../../utils/formatters';

const INTERVIEWERS = [
  { initials: 'SA', name: 'Siddharth A.', role: 'Design Lead · 8 yrs product design · ex-Flipkart' },
  { initials: 'MK', name: 'Meera K.', role: 'Sr. UX Designer · Design systems & accessibility focus' },
];

export default function PortalInterviews() {
  const { data: c } = usePortalProfile();
  const { data: documents = [] } = usePortalDocuments();
  const respond = usePortalRespondInterview();
  const resched = usePortalReschedule();
  const submit = usePortalSubmitAssignment();

  const [modal, setModal] = useState(false);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  if (!c) return null;

  const hasInterview = c.status === 'Interview' && !!c.interview_date;
  const assignments = documents.filter(d => d.kind === 'Request');

  return (
    <>
      <h1 className="pc-h1">Interviews</h1>
      <div className="pc-lead">Confirm your slot, review the prep pack, and submit any assignments.</div>

      {/* Upcoming / none */}
      {hasInterview ? (
        <div className="pc-card" style={{ borderColor: '#c7d9fb' }}>
          <div className="pc-ct" style={{ color: '#1e56d9' }}>Interview scheduled</div>
          <div className="pc-g2" style={{ marginBottom: 12 }}>
            <div><div className="pc-k">Date</div><div className="pc-v">{formatDate(c.interview_date)}</div></div>
            <div><div className="pc-k">Time</div><div className="pc-v">{c.interview_time || '—'}</div></div>
            <div><div className="pc-k">Mode</div><div className="pc-v">{c.interview_type || '—'}</div></div>
            <div><div className="pc-k">Link</div><div className="pc-v">
              {c.interview_link
                ? <a href={c.interview_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e56d9', fontWeight: 700 }}>Join meeting →</a>
                : '—'}
            </div></div>
          </div>
          {c.interview_instructions && (
            <div style={{ background: '#eef3fd', border: '1px solid #c7d9fb', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#1e56d9', marginBottom: 12 }}>
              {c.interview_instructions}
            </div>
          )}
          {c.interview_accepted === null || c.interview_accepted === undefined ? (
            !c.reschedule_requested && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="pc-btn pc-btn-grn" disabled={respond.isPending} onClick={() => respond.mutate(true)}>✓ Accept interview</button>
                <button className="pc-btn pc-btn-sec" disabled={respond.isPending} onClick={() => respond.mutate(false)}>✗ Cannot attend</button>
                <button className="pc-btn pc-btn-sec" disabled={respond.isPending} onClick={() => setModal(true)}>🔄 Request reschedule</button>
              </div>
            )
          ) : c.interview_accepted ? (
            <div style={{ background: '#ecfdf3', border: '1px solid #a6f0c6', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#067647', fontWeight: 700 }}>
              ✓ Accepted — you have confirmed attendance.
            </div>
          ) : (
            <div style={{ background: '#fef2f2', border: '1px solid #fcc5c5', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#b42318', fontWeight: 700 }}>
              ✗ Declined — HR has been notified.
            </div>
          )}
          {c.reschedule_requested && (
            <div style={{ background: '#fff8ed', border: '1px solid #f9dbaf', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#b93815', fontWeight: 600, marginTop: 10 }}>
              🔄 Reschedule {c.reschedule_status === 'Pending' ? 'requested — pending HR review' : c.reschedule_status === 'Approved' ? 'approved ✓' : 'not approved'}.
            </div>
          )}
        </div>
      ) : (
        <div className="pc-empty">
          <div style={{ fontWeight: 800, color: '#475569', marginBottom: 3 }}>No upcoming interviews</div>
          When HR schedules a round, it will show up here for you to confirm.
        </div>
      )}

      {/* Prep pack (static, with real link/instructions) */}
      <div className="pc-card">
        <div className="pc-ct">Interview Prep Pack</div>
        <div className="pc-g2" style={{ marginBottom: 14 }}>
          <div>
            <div className="pc-k">Agenda</div>
            <div className="pc-v" style={{ fontWeight: 500 }}>Portfolio walkthrough (20 min) · Design critique (25 min) · Q&amp;A (15 min)</div>
          </div>
          <div>
            <div className="pc-k">Dress code</div>
            <div className="pc-v" style={{ fontWeight: 500 }}>Smart casual · Video: plain background, stable internet</div>
          </div>
          <div>
            <div className="pc-k">Video link</div>
            <div className="pc-v">
              {c.interview_link
                ? <a href={c.interview_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e56d9', fontWeight: 700 }}>{c.interview_link}</a>
                : 'Shared once your interview is scheduled'}
            </div>
          </div>
          <div>
            <div className="pc-k">Office / map</div>
            <div className="pc-v" style={{ fontWeight: 500 }}>For in-person rounds: Block C, 4th Floor, Cyber City, Gurugram — reception on ground floor</div>
          </div>
        </div>
        <div className="pc-k" style={{ marginBottom: 8 }}>Who you&rsquo;ll meet</div>
        {INTERVIEWERS.map(p => (
          <div key={p.initials} className="pc-row" style={{ alignItems: 'center' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#6c31d9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{p.initials}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
              <div className="pc-muted">{p.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reschedule history (current request only) */}
      {c.reschedule_requested && (
        <div className="pc-card">
          <div className="pc-ct">Reschedule History</div>
          <div className="pc-row" style={{ alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {c.reschedule_proposed_date ? formatDate(c.reschedule_proposed_date) : '—'}
              {c.reschedule_proposed_time ? ` ${c.reschedule_proposed_time}` : ''}
              {' → '}
              {formatDate(c.interview_date)}
            </div>
            <span className="pc-chip gry">{c.reschedule_status || 'Pending'}</span>
          </div>
          {c.reschedule_reason && <div className="pc-muted" style={{ marginTop: 6 }}>Reason: {c.reschedule_reason}</div>}
        </div>
      )}

      {/* Assignments */}
      <div className="pc-card">
        <div className="pc-ct">Assignments &amp; Submissions</div>
        {assignments.length === 0 ? (
          <div className="pc-muted">No assignments yet.</div>
        ) : assignments.map(a => {
          const done = a.status === 'Completed';
          return (
            <div key={a.id} className="pc-row" style={{ alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
                <div className="pc-muted">
                  {done ? `Submitted ${a.responded_at ? formatDate(a.responded_at) : ''}` : (a.note || a.category || 'Pending')}
                </div>
              </div>
              {done ? (
                a.file_url
                  ? <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="pc-btn pc-btn-sec pc-btn-sm">View</a>
                  : <span className="pc-chip grn">Done</span>
              ) : (
                <>
                  <input
                    ref={el => { fileRefs.current[a.id] = el; }}
                    type="file" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) submit.mutate({ docId: a.id, file: f }); e.target.value = ''; }}
                  />
                  <button className="pc-btn pc-btn-pri pc-btn-sm" disabled={submit.isPending} onClick={() => fileRefs.current[a.id]?.click()}>
                    {submit.isPending ? 'Uploading…' : 'Submit'}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Reschedule modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(false)}>
          <div className="pc-card" style={{ width: 440, maxWidth: '95vw', marginBottom: 0 }} onClick={e => e.stopPropagation()}>
            <div className="pc-ct">Request reschedule</div>
            <div style={{ marginBottom: 12 }}>
              <div className="pc-k" style={{ marginBottom: 4 }}>Reason *</div>
              <textarea className="pc-input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Why do you need to reschedule?" />
            </div>
            <div className="pc-g2" style={{ marginBottom: 14 }}>
              <div>
                <div className="pc-k" style={{ marginBottom: 4 }}>Preferred date</div>
                <input className="pc-input" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <div className="pc-k" style={{ marginBottom: 4 }}>Preferred time</div>
                <input className="pc-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="pc-btn pc-btn-sec" onClick={() => setModal(false)}>Cancel</button>
              <button
                className="pc-btn pc-btn-pri"
                disabled={!reason || resched.isPending}
                onClick={() => resched.mutate({ reason, date, time }, { onSuccess: () => { setModal(false); setReason(''); setDate(''); setTime(''); } })}
              >
                {resched.isPending ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
