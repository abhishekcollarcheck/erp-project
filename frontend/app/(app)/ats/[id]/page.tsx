'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../../store';
import { setPageTitle } from '../../../../store/slices/uiSlice';
import { AppShell } from '../../../../layouts/AppLayout';
import { Chip } from '../../../../components/ui/Chip';
import { Modal } from '../../../../components/ui/Modal';

// Feature components
import { CandidateFormModal } from '../../../../features/candidates/components/CandidateFormModal';
import { StatusMoveModal } from '../../../../features/candidates/components/StatusMoveModal';
import { InterviewSchedulerModal } from '../../../../features/candidates/components/InterviewSchedulerModal';
import { InterviewResultModal } from '../../../../features/candidates/components/InterviewResultModal';
import { OfferLetterModal } from '../../../../features/candidates/components/OfferLetterModal';
import { HireCandidateModal } from '../../../../features/candidates/components/HireCandidateModal';
import { GrantPortalAccessModal } from '../../../../features/candidates/components/GrantPortalAccessModal';
import { WithdrawModal } from '../../../../features/candidates/components/WithdrawModal';
import { PreInterviewFormModal } from '../../../../features/candidates/components/PreInterviewFormModal';
import { AptitudeTestSendModal } from '../../../../features/candidates/components/AptitudeTestSendModal';
import { PreJoiningFormModal } from '../../../../features/candidates/components/PreJoiningFormModal';
import { ShareDocumentModal } from '../../../../features/candidates/components/ShareDocumentModal';

// Hooks
import {
  useCandidate,
  useCandidateActivity,
  useDeleteCandidate,
  useUploadResume,
  useMoveStatus,
  useDeleteDocument,
} from '../../../../features/candidates/hooks/useCandidates';
import { usePermission } from '../../../../features/auth/hooks/useAuth';
import { PermissionGuard } from '../../../../utils/permissionGuard';
// Types
import {
  STATUS_COLORS, STATUS_LABEL, SOURCE_EMOJI,
  VIEW_STAGE_STEPS, STATUS_TO_VIEW_STEP, PIPELINE_STAGES,
  type Candidate, type CandidateStatus, type CandidateDocument,
} from '../../../../features/candidates/types/candidate.types';
import { formatDate } from '../../../../utils/formatters';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Experience', 'Interviews', 'Docs', 'Offers', 'Activity'] as const;
type Tab = typeof TABS[number];

const ACTIVITY_LABELS: Record<string, string> = {
  CANDIDATE_CREATED: 'Candidate created',
  CANDIDATE_UPDATED: 'Profile updated',
  CANDIDATE_STATUS_CHANGED: 'Stage changed',
  CANDIDATE_DELETED: 'Candidate deleted',
  CANDIDATE_HIRED: 'Marked as hired',
  CANDIDATE_WITHDRAWN: 'Candidate withdrawn',
  CANDIDATE_DOC_SHARED: 'Document shared',
  CANDIDATE_DOC_RESPONDED: 'Document actioned by candidate',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  INTERVIEW_RESULT_SUBMITTED: 'Interview result recorded',
  RESCHEDULE_REQUESTED: 'Reschedule requested',
  OFFER_SENT: 'Offer letter sent',
  APTITUDE_TEST_SENT: 'Aptitude test sent',
  PRE_INTERVIEW_FORM_SENT: 'Pre-interview form sent',
  PRE_JOINING_FORM_SENT: 'Pre-joining form sent',
  PREJOINING_DRAFT_SAVED: 'Pre-joining draft saved',
  PREJOINING_SUBMITTED: 'Pre-joining form submitted',
};

// Activity → filter category. Only categories that map to real actions are shown.
function activityCategory(action: string): 'Profile' | 'Actions' {
  return action === 'CANDIDATE_UPDATED' ? 'Profile' : 'Actions';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CVCard({ title, count, action, children, style }: {
  title: string; count?: number; action?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div className="card cp" style={style}>
      <div className="cv-ct">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          {title}
          {count != null && <span className="cv-badge">{count}</span>}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="cv-k">{k}</div>
      <div className="cv-v">{v ?? '—'}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
    }}>
      <span style={{ color: 'var(--ink4)', fontWeight: 500, minWidth: 130, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );
}

function DashedEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px dashed var(--border2)', borderRadius: 'var(--r)', padding: '22px 16px',
      textAlign: 'center', color: 'var(--ink4)', fontSize: 12, background: 'var(--surface2)',
    }}>
      {children}
    </div>
  );
}

function fmtSalary(monthly: number | null | undefined) {
  if (!monthly) return '—';
  return `₹${Number(monthly).toLocaleString('en-IN')}/mo`;
}

// Tolerate a JSON column that came back as a raw string (MariaDB + Sequelize).
function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string' && v.trim()) {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; }
    catch { return v.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
}

function asObj(v: unknown): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === 'string' && v.trim()) { try { return asObj(JSON.parse(v)); } catch { /* ignore */ } }
  return {};
}

function activityDetail(oldV: unknown, newV: unknown): string | null {
  const o = asObj(oldV);
  const n = asObj(newV);
  if (n.status && o.status) return `${String(o.status).replace(/_/g, ' ')} → ${String(n.status).replace(/_/g, ' ')}`;
  if (n.status) return `→ ${String(n.status).replace(/_/g, ' ')}`;
  if (n.title) return String(n.title);
  if (n.candidate_decision) return `Decision: ${String(n.candidate_decision).replace(/_/g, ' ')}`;
  if (n.withdrawal_reason) return `Reason: ${String(n.withdrawal_reason)}`;
  if (n.reason) return `Reason: ${String(n.reason)}`;
  return null;
}

function docStatusText(d: CandidateDocument): string {
  if (d.status === 'Completed') return 'Provided';
  if (d.status === 'Read') return 'Read';
  return d.kind === 'Request' ? 'Requested' : 'Unread';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const id = parseInt(params.id as string, 10);
  const { canEdit, canDelete } = usePermission();

  const [tab, setTab] = useState<Tab>('Overview');
  const [activityFilter, setActivityFilter] = useState<'All' | 'Actions' | 'Profile'>('All');

  // Modal open states
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [movePreselect, setMovePreselect] = useState<CandidateStatus | undefined>(undefined);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [preFormOpen, setPreFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [aptitudeOpen, setAptitudeOpen] = useState(false);
  const [preJoiningOpen, setPreJoiningOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: candidate, isLoading, isError } = useCandidate(id);
  const { data: activity, isLoading: activityLoading } = useCandidateActivity(id, tab === 'Activity' || tab === 'Overview');
  const deleteMutation = useDeleteCandidate();
  const resumeMutation = useUploadResume(id);
  const moveStatus = useMoveStatus();
  const deleteDoc = useDeleteDocument(id);

  useEffect(() => {
    if (candidate) {
      dispatch(setPageTitle({ title: candidate.candidate_name, breadcrumb: 'ATS' }));
    }
  }, [candidate, dispatch]);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    router.push('/ats');
  };

  if (isLoading) {
    return (
      <PermissionGuard permission="recruitment:view">
        <AppShell>
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink4)', fontSize: 13 }}>
            Loading candidate…
          </div>
        </AppShell>
      </PermissionGuard>
    );
  }

  if (isError || !candidate) {
    return (
      <PermissionGuard permission="recruitment:view">
        <AppShell>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>Candidate not found</div>
            <button className="btn btn-sec btn-sm" onClick={() => router.push('/ats')}>← Back</button>
          </div>
        </AppShell>
      </PermissionGuard>
    );
  }

  const c = candidate as Candidate;
  const statusColor = STATUS_COLORS[c.status as CandidateStatus];
  const hr = canEdit('recruitment');
  const documents = c.documents ?? [];
  const pendingDocs = documents.filter(d => d.status === 'Pending');
  const completedDocs = documents.filter(d => d.status !== 'Pending');
  const unreadShares = documents.filter(d => d.kind === 'Share' && d.status === 'Pending').length;

  const isTerminal = c.status === 'Hired' || c.status === 'Rejected' || c.status === 'Withdrawn';
  const viewStep = STATUS_TO_VIEW_STEP[c.status as CandidateStatus] ?? -1;

  // ─── Primary "what to do next" action ────────────────────────────────────
  const primaryAction: { label: string; run: () => void } | null = (() => {
    if (!hr) return null;
    switch (c.status) {
      case 'Sourced':     return { label: 'Screen', run: () => moveStatus.mutate({ id, status: 'Screened' }) };
      case 'Screened':    return { label: 'Shortlist', run: () => moveStatus.mutate({ id, status: 'Shortlisted' }) };
      case 'Shortlisted': return { label: 'Schedule Interview', run: () => setScheduleOpen(true) };
      case 'Interview':   return c.interview_date
        ? { label: 'Record Result', run: () => setResultOpen(true) }
        : { label: 'Schedule Interview', run: () => setScheduleOpen(true) };
      case 'Offered':     return c.offer_sent_at
        ? { label: 'Confirm Hire', run: () => setHireOpen(true) }
        : { label: 'Send Offer Letter', run: () => setOfferOpen(true) };
      case 'On_Hold':     return { label: 'Re-activate', run: () => { setMovePreselect(undefined); setMoveOpen(true); } };
      default:            return null;
    }
  })();

  const suggestedNext = c.status === 'Interview' || c.status === 'Offered' || c.status === 'On_Hold'
    ? primaryAction?.label
    : PIPELINE_STAGES[Math.min(PIPELINE_STAGES.indexOf(c.status as CandidateStatus) + 1, PIPELINE_STAGES.length - 1)];

  // ─── Contextual secondary action buttons (screenshot action bar) ─────────
  const renderActions = () => {
    const btns: React.ReactNode[] = [];

    if (hr && (c.status === 'Shortlisted' || c.status === 'Interview')) {
      btns.push(
        <button key="schedule" className="btn btn-sec btn-sm" onClick={() => setScheduleOpen(true)}>
          {c.interview_date ? 'Reschedule' : 'Schedule Interview'}
        </button>
      );
    }

    if (c.status === 'Interview' && c.interview_date && c.interview_accepted === true && hr) {
      btns.push(
        <button key="preform" className="btn btn-sec btn-sm" onClick={() => setPreFormOpen(true)}>
          {c.pre_interview_form_sent ? 'Resend Pre-Interview Form' : 'Send Pre-Interview Form'}
        </button>
      );
    }

    if (c.status === 'Interview' && c.interview_date && hr) {
      btns.push(
        <button key="result" className="btn btn-sec btn-sm" onClick={() => setResultOpen(true)}>
          Record Result
        </button>
      );
    }

    if (c.status === 'Offered' && hr) {
      btns.push(
        <button key="offer" className="btn btn-sec btn-sm" onClick={() => setOfferOpen(true)}>
          {c.offer_sent_at ? 'Resend Offer' : 'Issue Offer'}
        </button>
      );
      btns.push(
        <button key="hire" className="btn btn-sec btn-sm" onClick={() => setHireOpen(true)}>
          Confirm Hire
        </button>
      );
    }

    if (hr) {
      btns.push(
        <button key="aptitude" className="btn btn-sec btn-sm" onClick={() => setAptitudeOpen(true)}>
          {c.aptitude_test_sent ? 'Resend Aptitude Test' : 'Send Aptitude Test'}
        </button>
      );
      btns.push(
        <button key="move" className="btn btn-sec btn-sm" onClick={() => { setMovePreselect(undefined); setMoveOpen(true); }}>
          Change Stage
        </button>
      );
    }

    return btns;
  };

  // ─── Header primary buttons ─────────────────────────────────────────────
  const headerButtons = (
    <>
      {primaryAction && (
        <button className="btn btn-pri btn-sm" onClick={primaryAction.run} disabled={moveStatus.isPending}>
          {primaryAction.label}
        </button>
      )}
      {hr && (c.status === 'Shortlisted' || c.status === 'Interview') && (
        <button className="btn btn-sec btn-sm" onClick={() => setScheduleOpen(true)}>
          {c.interview_date ? 'Reschedule' : 'Schedule'}
        </button>
      )}
      {hr && (c.status === 'Rejected' || c.status === 'Withdrawn') && (
        <button className="btn btn-sec btn-sm" onClick={() => { setMovePreselect(undefined); setMoveOpen(true); }}>Re-activate</button>
      )}
      {hr && <button className="btn btn-sec btn-sm" onClick={() => setEditOpen(true)}>Edit</button>}
      {canDelete('recruitment') && (
        <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>Delete</button>
      )}
    </>
  );

  // ─── Tab: Overview ──────────────────────────────────────────────────────────
  const OverviewTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      {/* ── Left column ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <CVCard title="Current Stage" action={<span style={{ fontSize: 11, color: 'var(--ink4)', textTransform: 'none', letterSpacing: 0 }}>Now: <strong style={{ color: 'var(--ink)' }}>{STATUS_LABEL[c.status as CandidateStatus] || c.status}</strong></span>}>
          {isTerminal || viewStep < 0 ? (
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--r)', fontSize: 12, fontWeight: 500,
              background: statusColor?.bg, color: statusColor?.text, border: `1px solid ${statusColor?.border}`,
            }}>
              {c.status === 'Hired' ? '🎉 Candidate hired.'
                : c.status === 'Rejected' ? 'Candidate rejected.'
                : c.status === 'Withdrawn' ? 'Candidate withdrawn from the pipeline.'
                : 'Candidate is on hold.'}
            </div>
          ) : (
            <>
              <div className="cv-step">
                {VIEW_STAGE_STEPS.map((step, idx) => {
                  const done = idx < viewStep;
                  const curr = idx === viewStep;
                  return (
                    <div key={step} className="cv-step-i">
                      {idx < VIEW_STAGE_STEPS.length - 1 && (
                        <span className="cv-step-line" style={{ background: done ? 'var(--blue)' : 'var(--border2)' }} />
                      )}
                      <span className="cv-dot" style={{
                        background: done ? 'var(--blue)' : curr ? 'var(--blue-lt)' : 'var(--surface2)',
                        borderColor: done ? 'var(--blue)' : curr ? 'var(--blue)' : 'var(--border2)',
                        color: done ? '#fff' : curr ? 'var(--blue)' : 'var(--ink4)',
                      }}>
                        {done ? '✓' : idx + 1}
                      </span>
                      <span className="cv-step-lbl" style={{ color: done || curr ? 'var(--ink)' : 'var(--ink4)', fontWeight: curr ? 700 : 500 }}>
                        {step}
                      </span>
                      <span className="cv-step-sub">
                        {idx === 0 ? formatDate(c.created_at) : done ? 'Done' : curr ? 'Current' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {suggestedNext && (
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--ink4)' }}>
                  Suggested next: <strong style={{ color: 'var(--ink3)' }}>{suggestedNext}</strong>
                </div>
              )}
            </>
          )}
        </CVCard>

        {primaryAction && (
          <div className="card cp">
            <div className="cv-k" style={{ color: 'var(--blue)' }}>What to do next</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: '4px 0 3px' }}>{primaryAction.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 12 }}>
              Primary action for {STATUS_LABEL[c.status as CandidateStatus] || c.status} stage.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-pri btn-sm" onClick={primaryAction.run} disabled={moveStatus.isPending}>{primaryAction.label}</button>
              {hr && <button className="btn btn-sec btn-sm" onClick={() => setEditOpen(true)}>Edit profile</button>}
              {c.is_portal_user && (
                <button className="btn btn-sec btn-sm" onClick={() => window.open('/portal/login', '_blank')}>Open portal</button>
              )}
            </div>
          </div>
        )}

        {unreadShares > 0 && (
          <div className="card cp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{unreadShares} unread document{unreadShares > 1 ? 's' : ''}</div>
              <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 2 }}>Shared files the candidate has not opened yet.</div>
            </div>
            <button className="btn btn-sec btn-sm" onClick={() => setTab('Docs')}>Open docs</button>
          </div>
        )}

        <CVCard title="Candidate Snapshot" action={hr && <span className="cv-ct-act" onClick={() => setEditOpen(true)}>Edit</span>}>
          <div className="cv-stat" style={{ marginBottom: 12 }}>
            <Stat k="Role" v={c.apply_designation} />
            <Stat k="Department" v={c.apply_department} />
            <Stat k="Job Description" v="—" />
            <Stat k="Location" v={c.location} />
            <Stat k="Experience" v={c.total_experience != null ? `${c.total_experience} yrs` : null} />
            <Stat k="Source" v={c.source ? `${SOURCE_EMOJI[c.source] || ''} ${c.source}` : null} />
          </div>
          <div className="cv-stat cv-stat-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <Stat k="Email" v={c.email ? <a href={`mailto:${c.email}`} style={{ color: 'var(--blue)' }}>{c.email}</a> : null} />
            <Stat k="Phone" v={c.phone_number ? <a href={`tel:${c.phone_number}`} style={{ color: 'var(--blue)' }}>{c.phone_number}</a> : null} />
            <Stat k="Portal Access" v={c.is_portal_user ? 'Granted' : 'Not granted'} />
          </div>
        </CVCard>

        <CVCard title="Latest Activity" action={<span className="cv-ct-act" onClick={() => setTab('Activity')}>Full activity</span>}>
          {activityLoading ? (
            <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '6px 0' }}>Loading…</div>
          ) : !activity?.length ? (
            <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '6px 0' }}>No activity yet</div>
          ) : (
            activity.slice(0, 4).map(a => {
              const detail = activityDetail(a.old_values, a.new_values);
              return (
                <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{a.actor_name}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink4)', flexShrink: 0 }}>
                      {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 1 }}>
                    {ACTIVITY_LABELS[a.action] || a.action.replace(/_/g, ' ')}{detail ? ` · ${detail}` : ''}
                  </div>
                </div>
              );
            })
          )}
        </CVCard>
      </div>

      {/* ── Right column ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CVCard
          title="Portal Access"
          action={<Chip variant={c.is_portal_user ? 'green' : 'gray'}>{c.is_portal_user ? 'Granted' : 'Not granted'}</Chip>}
        >
          {c.is_portal_user ? (
            <>
              <div style={{
                background: 'var(--green-lt)', border: '1px solid var(--green-bd)', borderRadius: 'var(--r)',
                padding: '10px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>Granted</div>
                  <div style={{ fontSize: 11, color: 'var(--ink3)' }}>Candidate can sign in</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>Live</span>
              </div>
              <div className="cv-stat" style={{ marginBottom: 12 }}>
                <Stat k="Login Email" v={c.email} />
                <Stat k="Last Login" v={c.portal_last_login ? formatDate(c.portal_last_login) : 'Never'} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-pri btn-sm" onClick={() => window.open('/portal/login', '_blank')}>Open portal</button>
                {hr && <button className="btn btn-sec btn-sm" onClick={() => setPortalOpen(true)}>Reset password</button>}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 10 }}>Portal access has not been granted yet.</div>
              {hr && <button className="btn btn-pri btn-sm" onClick={() => setPortalOpen(true)}>Grant access</button>}
            </div>
          )}
        </CVCard>

        {pendingDocs.length > 0 && (
          <CVCard title="Pending by Candidate" count={pendingDocs.length}>
            <div className="cv-scroll">
              {pendingDocs.map(d => (
                <div key={d.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>
                    {d.kind === 'Share' ? 'Unread in portal' : `${d.category || 'Document'} pending`}
                  </div>
                </div>
              ))}
            </div>
          </CVCard>
        )}

        {completedDocs.length > 0 && (
          <CVCard title="Completed by Candidate" count={completedDocs.length}>
            <div className="cv-scroll">
              {completedDocs.map(d => (
                <div key={d.id} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>
                    {d.status === 'Completed' ? 'Provided' : 'Read'}{d.responded_at ? ` · ${formatDate(d.responded_at)}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </CVCard>
        )}
      </div>
    </div>
  );

  // ─── Tab: Experience ───────────────────────────────────────────────────────
  const ExperienceTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <CVCard title="Work Experience" action={hr && <span className="cv-ct-act" onClick={() => setEditOpen(true)}>Edit</span>}>
        <div className="cv-stat" style={{ marginBottom: 14 }}>
          <Stat k="Profile Type" v={c.fresher ? 'Fresher' : 'Experienced'} />
          <Stat k="Total Experience" v={c.total_experience != null ? `${c.total_experience} yrs` : null} />
          <Stat k="Relevant Experience" v={c.relevant_experience != null ? `${c.relevant_experience} yrs` : null} />
          <Stat k="Currently Working" v={c.currently_working == null ? null : c.currently_working ? 'Yes' : 'No'} />
          <Stat k="Current / Last Company" v={c.current_company_name} />
          <Stat k="Current / Last Designation" v={c.current_company_designation} />
          <Stat k="Notice / Availability" v={c.immediate_joiner ? 'Immediate' : c.notice_period != null ? `${c.notice_period} days` : null} />
          <Stat k="Last Drawn Salary" v={c.current_salary ? fmtSalary(c.current_salary) : null} />
          <Stat k="Expected Salary" v={c.expected_salary ? fmtSalary(c.expected_salary) : null} />
          <Stat k="Owns Vehicle" v={c.own_vehicle ? (asArray(c.vehicle_types).join(', ') || 'Yes') : null} />
        </div>
        {c.employments?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {c.employments.map((emp, i) => (
              <div key={emp.id ?? i} style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '10px 12px', fontSize: 12, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                  {emp.company}{emp.designation ? ` · ${emp.designation}` : ''}
                  {emp.currently_working && <span style={{ marginLeft: 6 }}><Chip variant="green">Current</Chip></span>}
                </div>
                <div style={{ color: 'var(--ink4)' }}>
                  {formatDate(emp.joining_date)} → {emp.currently_working ? 'Present' : formatDate(emp.leaving_date)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DashedEmpty>No employment history on file.</DashedEmpty>
        )}
      </CVCard>

      <CVCard title="Education" action={hr && <span className="cv-ct-act" onClick={() => setEditOpen(true)}>Edit</span>}>
        <div className="cv-stat">
          <Stat k="Highest Qualification" v={c.qualification} />
          <Stat k="Course / Stream" v={c.course} />
          <Stat k="Institute" v={c.institute} />
          <Stat k="Mode" v={c.edu_mode} />
          <Stat k="Start Date" v={c.edu_start_date ? formatDate(c.edu_start_date) : null} />
          <Stat k="End Date" v={c.edu_currently_pursuing ? 'Present' : c.edu_end_date ? formatDate(c.edu_end_date) : null} />
          <Stat k="Duration" v={
            c.edu_start_date && (c.edu_end_date || c.edu_currently_pursuing)
              ? `${new Date(c.edu_start_date).getFullYear()} – ${c.edu_currently_pursuing ? 'Present' : new Date(c.edu_end_date as string).getFullYear()}`
              : null
          } />
        </div>
      </CVCard>
    </div>
  );

  // ─── Tab: Interviews ───────────────────────────────────────────────────────
  const InterviewsTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CVCard
          title="Interviews"
          action={hr && (c.status === 'Shortlisted' || c.status === 'Interview') && (
            <span className="cv-ct-act" onClick={() => setScheduleOpen(true)}>{c.interview_date ? 'Reschedule' : '+ Schedule Round 1'}</span>
          )}
        >
          {c.interview_date ? (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
                  Round 1 · {c.interview_type || 'Interview'}
                </span>
                {c.interview_accepted === null || c.interview_accepted === undefined
                  ? <Chip variant="amber">Awaiting</Chip>
                  : c.interview_accepted ? <Chip variant="green">Accepted</Chip> : <Chip variant="red">Declined</Chip>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                {formatDate(c.interview_date)}{c.interview_time ? ` · ${c.interview_time}` : ''}
              </div>
              {c.interview_link && (
                <div style={{ marginTop: 6 }}>
                  <a href={c.interview_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>🔗 Join interview →</a>
                </div>
              )}
              {c.interview_instructions && (
                <div style={{ marginTop: 8, background: 'var(--blue-lt)', border: '1px solid var(--blue-md)', borderRadius: 'var(--r)', padding: '8px 10px', fontSize: 11, color: 'var(--blue)' }}>
                  {c.interview_instructions}
                </div>
              )}
              {hr && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn-sec btn-sm" onClick={() => setScheduleOpen(true)}>Reschedule</button>
                  {c.interview_accepted === true && (
                    <button className="btn btn-sec btn-sm" onClick={() => setPreFormOpen(true)}>
                      {c.pre_interview_form_sent ? 'Resend Pre-Interview Form' : 'Send Pre-Interview Form'}
                    </button>
                  )}
                  <button className="btn btn-pri btn-sm" onClick={() => setResultOpen(true)}>Record Result</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '18px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 10 }}>No active interviews.</div>
              {hr && (c.status === 'Shortlisted' || c.status === 'Interview') && (
                <button className="btn btn-pri btn-sm" onClick={() => setScheduleOpen(true)}>+ Schedule Round 1</button>
              )}
            </div>
          )}

          {c.reschedule_requested && c.reschedule_status === 'Pending' && (
            <div style={{ marginTop: 12, background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)', padding: '10px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>🔄 Reschedule requested</div>
              <div style={{ fontSize: 11, color: 'var(--ink3)' }}>
                {c.reschedule_reason || '—'}
                {c.reschedule_proposed_date && <> · Proposed {formatDate(c.reschedule_proposed_date)} {c.reschedule_proposed_time || ''}</>}
              </div>
              {hr && <button className="btn btn-sec btn-sm" style={{ marginTop: 8 }} onClick={() => setScheduleOpen(true)}>✓ Approve &amp; Reschedule</button>}
            </div>
          )}
        </CVCard>

        <CVCard
          title="Aptitude Test"
          action={hr && <span className="cv-ct-act" onClick={() => setAptitudeOpen(true)}>{c.aptitude_test_sent ? 'Resend' : 'Send'}</span>}
        >
          <InfoRow label="Test sent" value={
            c.aptitude_test_sent
              ? <Chip variant="green">✓ Sent {c.aptitude_test_sent_at ? formatDate(c.aptitude_test_sent_at as any) : ''}</Chip>
              : <Chip variant="gray">Not sent</Chip>
          } />
          {c.aptitude_attempted_at ? (
            <>
              <InfoRow label="Attempted" value={formatDate(c.aptitude_attempted_at)} />
              <InfoRow label="Score (HR only)" value={
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>{c.aptitude_score ?? '—'}</span>
              } />
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '6px 0' }}>Not attempted yet</div>
          )}
        </CVCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {c.candidate_decision && (
          <CVCard title={`${c.candidate_decision === 'Select' ? '✓ Selected' : c.candidate_decision === 'Reject' ? '✗ Rejected' : '⏸ On Hold'} — Interview Result`}>
            {c.interview_result_date && <InfoRow label="Result date" value={new Date(c.interview_result_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} />}
            {c.interview_result_mode && <InfoRow label="Mode" value={c.interview_result_mode} />}
            {c.decision_joining_date && <InfoRow label="Joining date" value={formatDate(c.decision_joining_date)} />}
            {c.decision_reason && (
              <div style={{ marginTop: 10, background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: 3 }}>REASON</span>
                {c.decision_reason}
              </div>
            )}
            {c.interview_result_feedback && (
              <div style={{ marginTop: 10, background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink4)', display: 'block', marginBottom: 3 }}>FEEDBACK</span>
                {c.interview_result_feedback}
              </div>
            )}
          </CVCard>
        )}
      </div>
    </div>
  );

  // ─── Tab: Docs ─────────────────────────────────────────────────────────────
  const resumeInput = (label: string) => (
    <label style={{ cursor: 'pointer' }}>
      <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) resumeMutation.mutate(f); e.target.value = ''; }} />
      <span className="btn btn-sec btn-sm">{resumeMutation.isPending ? 'Uploading…' : label}</span>
    </label>
  );

  const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
  const docHref = (u?: string | null) => (u ? (u.startsWith('http') ? u : `${apiOrigin}${u}`) : undefined);

  const DocsTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CVCard title="Resume" action={hr && c.resume_url && resumeInput('Replace')}>
          {c.resume_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 26 }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Resume on file</div>
                <a href={docHref(c.resume_url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--blue)' }}>View / Download →</a>
              </div>
            </div>
          ) : (
            <DashedEmpty>
              <div style={{ marginBottom: 10 }}>No resume on file.</div>
              {hr && resumeInput('Upload via edit')}
            </DashedEmpty>
          )}
        </CVCard>

        <CVCard title="Forms">
          <InfoRow label="Pre-interview form" value={
            <Chip variant={c.preinterview_form_status === 'Submitted' ? 'green' : c.preinterview_form_status === 'Draft' ? 'amber' : 'gray'}>
              {c.preinterview_form_status === 'Submitted' ? '✓ Submitted' : c.preinterview_form_status === 'Draft' ? 'Draft' : 'Not started'}
            </Chip>
          } />
          <InfoRow label="Pre-joining form" value={
            <Chip variant={c.prejoining_form_status === 'Submitted' ? 'green' : c.prejoining_form_status === 'Draft' ? 'amber' : 'gray'}>
              {c.prejoining_form_status === 'Submitted' ? '✓ Submitted' : c.prejoining_form_status === 'Draft' ? 'Draft' : 'Not started'}
            </Chip>
          } />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {c.interview_accepted === true && hr && (
              <button className="btn btn-sec btn-sm" onClick={() => setPreFormOpen(true)}>
                {c.pre_interview_form_sent ? 'Resend Pre-Interview' : 'Send Pre-Interview'}
              </button>
            )}
            {c.status === 'Offered' && hr && (
              <button className="btn btn-sec btn-sm" onClick={() => setPreJoiningOpen(true)}>
                {c.pre_joining_form_sent ? 'Resend Pre-Joining' : 'Send Pre-Joining'}
              </button>
            )}
            {c.preinterview_form_status === 'Submitted' && hr && (
              <button className="btn btn-sec btn-sm" onClick={() => router.push(`/ats/${id}/forms`)}>View Forms</button>
            )}
          </div>
        </CVCard>
      </div>

      <CVCard
        title="Shared Documents"
        count={documents.length}
        action={hr && <span className="cv-ct-act" onClick={() => setShareOpen(true)}>+ Share document</span>}
      >
        {documents.length ? (
          documents.map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                  {docHref(d.file_url)
                    ? <a href={docHref(d.file_url)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)' }}>{d.title}</a>
                    : d.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>
                  {(d.category || (d.kind === 'Request' ? 'Requested' : 'Document'))} · {formatDate(d.shared_at)} · {docStatusText(d)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {d.category && <Chip variant="gray">{d.category}</Chip>}
                {hr && (
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', cursor: 'pointer' }}
                    onClick={() => deleteDoc.mutate(d.id)}
                  >
                    Remove
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <DashedEmpty>
            <div style={{ marginBottom: hr ? 10 : 0 }}>No documents shared yet.</div>
            {hr && <button className="btn btn-sec btn-sm" onClick={() => setShareOpen(true)}>+ Share document</button>}
          </DashedEmpty>
        )}
      </CVCard>
    </div>
  );

  // ─── Tab: Offers ───────────────────────────────────────────────────────────
  const hasOffer = c.status === 'Offered' || c.status === 'Hired' || c.offer_sent_at;
  const OffersTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <CVCard
        title="Offers"
        action={c.status === 'Offered' && hr && (
          <span className="cv-ct-act" onClick={() => setOfferOpen(true)}>{c.offer_sent_at ? 'Resend offer' : 'Issue offer'}</span>
        )}
      >
        {hasOffer ? (
          <>
            <InfoRow label="Offered CTC (mo)" value={c.offered_ctc ? fmtSalary(c.offered_ctc) : null} />
            <InfoRow label="Joining date" value={formatDate(c.confirmed_joining_date)} />
            <InfoRow label="Offer valid till" value={c.offer_valid_till ? new Date(c.offer_valid_till).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null} />
            <InfoRow label="Offer sent" value={c.offer_sent_at ? new Date(c.offer_sent_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            {c.offer_letter_url && (
              <div style={{ marginTop: 8 }}>
                <a href={docHref(c.offer_letter_url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>📄 View Offer Letter →</a>
              </div>
            )}
            {c.status === 'Offered' && hr && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {!c.offer_sent_at && (
                  <button className="btn btn-pri btn-sm" onClick={() => setOfferOpen(true)}>Send Offer Letter</button>
                )}
                <button className="btn btn-sec btn-sm" onClick={() => setHireOpen(true)}>Confirm Hire</button>
              </div>
            )}
            {c.status === 'Hired' && c.converted_employee_id && (
              <button className="btn btn-sec btn-sm" style={{ marginTop: 12 }} onClick={() => router.push(`/employees/${c.converted_employee_id}`)}>
                👤 View Employee Record →
              </button>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '18px 0' }}>
            <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 10 }}>No offer letters yet.</div>
            {hr && c.status === 'Offered' && <button className="btn btn-pri btn-sm" onClick={() => setOfferOpen(true)}>Issue offer</button>}
          </div>
        )}
      </CVCard>
    </div>
  );

  // ─── Tab: Activity ─────────────────────────────────────────────────────────
  const activityList = activity ?? [];
  const grouped = (() => {
    const list = activityList.filter(a => activityFilter === 'All' || activityCategory(a.action) === activityFilter);
    const out: { key: string; actor: string; items: typeof list }[] = [];
    for (const a of list) {
      const day = new Date(a.created_at).toDateString();
      const last = out[out.length - 1];
      if (last && last.actor === a.actor_name && last.key === day) last.items.push(a);
      else out.push({ key: day, actor: a.actor_name, items: [a] });
    }
    return out;
  })();

  const filterCounts = {
    All: activityList.length,
    Actions: activityList.filter(a => activityCategory(a.action) === 'Actions').length,
    Profile: activityList.filter(a => activityCategory(a.action) === 'Profile').length,
  };

  const ActivityTab = (
    <div>
      <div style={{ marginBottom: 4, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Activity</div>
      <div style={{ fontSize: 11, color: 'var(--ink4)', marginBottom: 12 }}>Newest first · related items are grouped</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {(['All', 'Actions', 'Profile'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActivityFilter(f)}
            className={`btn btn-sm ${activityFilter === f ? 'btn-pri' : 'btn-sec'}`}
          >
            {f} <span style={{ opacity: .7, marginLeft: 3 }}>{filterCounts[f]}</span>
          </button>
        ))}
      </div>

      {activityLoading ? (
        <div className="card cp" style={{ textAlign: 'center', color: 'var(--ink4)', fontSize: 12, padding: '30px 0' }}>Loading activity…</div>
      ) : !grouped.length ? (
        <div className="card cp" style={{ textAlign: 'center', color: 'var(--ink4)', fontSize: 12, padding: '30px 0' }}>No activity recorded</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {grouped.map((g, gi) => {
            const head = g.items[0];
            const multi = g.items.length > 1;
            return (
              <div key={gi} className="card cp">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: multi ? 8 : 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    {multi
                      ? <>{g.items.length} actions <span className="cv-badge">{g.items.length}</span></>
                      : (ACTIVITY_LABELS[head.action] || head.action.replace(/_/g, ' '))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink4)', flexShrink: 0, textAlign: 'right' }}>
                    {new Date(head.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    <div>by {head.actor_name}</div>
                  </div>
                </div>
                {multi && g.items.map(a => {
                  const detail = activityDetail(a.old_values, a.new_values);
                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                        {ACTIVITY_LABELS[a.action] || a.action.replace(/_/g, ' ')}
                        {detail ? <span style={{ color: 'var(--ink4)' }}> · {detail}</span> : null}
                      </span>
                      <span style={{ color: 'var(--ink4)', flexShrink: 0 }}>{new Date(a.created_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
                    </div>
                  );
                })}
                {!multi && activityDetail(head.old_values, head.new_values) && (
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginTop: 3 }}>{activityDetail(head.old_values, head.new_values)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const TAB_CONTENT: Record<Tab, React.ReactNode> = {
    Overview: OverviewTab,
    Experience: ExperienceTab,
    Interviews: InterviewsTab,
    Docs: DocsTab,
    Offers: OffersTab,
    Activity: ActivityTab,
  };

  const initials = (c.candidate_name || '').trim().split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <PermissionGuard permission="recruitment:view">
      <AppShell>
        <div className="pg-enter cv">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="ph">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div className="cv-av">{initials}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0 }}>{c.candidate_name}</h1>
                  {statusColor && (
                    <span style={{
                      background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}`,
                      borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700,
                    }}>
                      {STATUS_LABEL[c.status as CandidateStatus] || c.status}
                    </span>
                  )}
                </div>
                <div className="cv-meta" style={{ marginTop: 6 }}>
                  {c.reference_code && <span style={{ fontFamily: 'var(--mono)' }}>{c.reference_code}</span>}
                  <span>·</span>
                  <span>{c.total_experience != null ? `${c.total_experience} yrs` : '—'}</span>
                  {c.source && <><span>·</span><Chip variant="blue">{SOURCE_EMOJI[c.source] || ''} {c.source}</Chip></>}
                  {c.location && <><span>·</span><span>📍 {c.location}</span></>}
                </div>
              </div>
            </div>

            <div className="ph-r">
              <button className="btn btn-sec btn-sm" onClick={() => router.push('/ats')}>← Back</button>
              {headerButtons}
            </div>
          </div>

          {/* ── Primary action bar ─────────────────────────────────────── */}
          {!isTerminal && hr && (
            <div className="cv-actbar">
              <div className="cv-actbar-l">
                {primaryAction && (
                  <button className="btn btn-pri btn-sm" onClick={primaryAction.run} disabled={moveStatus.isPending}>
                    {primaryAction.label} →
                  </button>
                )}
                {renderActions()}
              </div>
              <div className="cv-actbar-r">
                {c.status !== 'On_Hold' && (
                  <button className="btn btn-sm" style={{ background: 'var(--amber-lt)', borderColor: 'var(--amber-bd)', color: 'var(--amber)' }}
                    onClick={() => { setMovePreselect('On_Hold'); setMoveOpen(true); }}>
                    Hold
                  </button>
                )}
                <button className="btn btn-sm" style={{ background: 'var(--red-lt)', borderColor: 'var(--red-bd)', color: 'var(--red)' }}
                  onClick={() => { setMovePreselect('Rejected'); setMoveOpen(true); }}>
                  Reject
                </button>
                <button className="btn btn-sec btn-sm" onClick={() => setWithdrawOpen(true)}>Withdraw</button>
              </div>
            </div>
          )}

          {/* ── Tabs ───────────────────────────────────────────────────── */}
          <div className="tabs" style={{ marginBottom: 16, overflowX: 'auto' }}>
            {TABS.map(t => (
              <div key={t} className={`tab${t === tab ? ' on' : ''}`} onClick={() => setTab(t)} style={{ whiteSpace: 'nowrap' }}>
                {t}
              </div>
            ))}
          </div>

          {TAB_CONTENT[tab]}
        </div>

        {/* ── All Modals ───────────────────────────────────────────────────── */}
        <CandidateFormModal open={editOpen} onClose={() => setEditOpen(false)} candidate={c} />
        <StatusMoveModal open={moveOpen} onClose={() => setMoveOpen(false)} candidate={c} preselect={movePreselect} />
        <InterviewSchedulerModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} candidate={c} />
        <InterviewResultModal open={resultOpen} onClose={() => setResultOpen(false)} candidate={c} />
        <AptitudeTestSendModal open={aptitudeOpen} onClose={() => setAptitudeOpen(false)} candidate={c} />
        <GrantPortalAccessModal open={portalOpen} onClose={() => setPortalOpen(false)} candidate={c} />
        <PreJoiningFormModal open={preJoiningOpen} onClose={() => setPreJoiningOpen(false)} candidate={c} />
        <PreInterviewFormModal open={preFormOpen} onClose={() => setPreFormOpen(false)} candidate={c} />
        <OfferLetterModal open={offerOpen} onClose={() => setOfferOpen(false)} candidate={c} />
        <HireCandidateModal open={hireOpen} onClose={() => setHireOpen(false)} candidate={c} />
        <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} candidate={c} />
        <ShareDocumentModal open={shareOpen} onClose={() => setShareOpen(false)} candidate={c} />

        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Delete Candidate"
          subtitle={`Remove ${c.candidate_name}?`}
          footer={
            <>
              <button className="btn btn-sec" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Removing…' : 'Yes, Remove'}
              </button>
            </>
          }
        >
          <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
            ⚠ Soft delete — the candidate record is preserved in audit logs.
          </div>
        </Modal>

        <style>{`
          .cv h1 { font-size: 20px; font-weight: 700; letter-spacing: -.4px; color: var(--ink); }
          .cv-av {
            width: 52px; height: 52px; border-radius: 13px; flex-shrink: 0;
            background: linear-gradient(135deg, var(--blue), var(--purple));
            color: #fff; font-weight: 700; font-size: 18px;
            display: flex; align-items: center; justify-content: center;
          }
          .cv-meta { font-size: 11px; color: var(--ink4); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
          .cv-ct {
            font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
            color: var(--ink4); display: flex; align-items: center; justify-content: space-between;
            gap: 8px; margin-bottom: 12px;
          }
          .cv-ct-act { font-size: 12px; font-weight: 600; text-transform: none; letter-spacing: 0; color: var(--blue); cursor: pointer; }
          .cv-badge {
            background: var(--surface2); border: 1px solid var(--border); border-radius: 99px;
            padding: 0 7px; font-size: 11px; font-weight: 700; color: var(--ink3); line-height: 18px;
          }
          .cv-stat { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
          .cv-stat.cv-stat-3 { grid-template-columns: 1fr 1fr 1fr; }
          .cv-k { font-size: 10px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; color: var(--ink4); margin-bottom: 2px; }
          .cv-v { font-size: 12.5px; color: var(--ink); font-weight: 500; word-break: break-word; }
          .cv-scroll { max-height: 240px; overflow-y: auto; }
          .cv-actbar {
            display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
            background: var(--surface2); border: 1px solid var(--border); border-radius: var(--r2);
            padding: 8px 10px; margin-bottom: 16px;
          }
          .cv-actbar-l, .cv-actbar-r { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
          .cv-step { display: flex; align-items: flex-start; }
          .cv-step-i { flex: 1; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; padding: 0 2px; }
          .cv-step-line { position: absolute; left: 50%; top: 12px; width: 100%; height: 2px; z-index: 0; }
          .cv-dot {
            position: relative; z-index: 1; width: 26px; height: 26px; border-radius: 50%;
            border: 2px solid; display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700;
          }
          .cv-step-lbl { margin-top: 6px; font-size: 10px; line-height: 1.3; }
          .cv-step-sub { font-size: 9px; color: var(--ink4); margin-top: 1px; }
          @media (max-width: 640px) {
            .cv-stat, .cv-stat.cv-stat-3 { grid-template-columns: 1fr 1fr; }
          }
        `}</style>
      </AppShell>
    </PermissionGuard>
  );
}
