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

// Hooks
import {
  useCandidate,
  useCandidateActivity,
  useDeleteCandidate,
  useUploadResume,
} from '../../../../features/candidates/hooks/useCandidates';
import { usePermission } from '../../../../features/auth/hooks/useAuth';
import { PermissionGuard } from '../../../../utils/permissionGuard';
// Types
import {
  STATUS_COLORS, STATUS_LABEL, SOURCE_EMOJI,
  type CandidateStatus,
} from '../../../../features/candidates/types/candidate.types';
import { formatDate } from '../../../../utils/formatters';

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Experience', 'Interviews', 'Docs', 'Offers', 'Activity'] as const;
type Tab = typeof TABS[number];

const ACTIVITY_LABELS: Record<string, string> = {
  CANDIDATE_CREATED: 'Candidate created',
  CANDIDATE_UPDATED: 'Details updated',
  CANDIDATE_STATUS_CHANGED: 'Stage changed',
  CANDIDATE_DELETED: 'Candidate deleted',
  CANDIDATE_HIRED: 'Marked as hired',
  CANDIDATE_WITHDRAWN: 'Candidate withdrawn',
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
    }}>
      <span style={{ color: 'var(--ink4)', fontWeight: 500, minWidth: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card cp">
      <div className="ct">
        {title}
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="card cp" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink4)', fontSize: 12 }}>
      {children}
    </div>
  );
}

function fmtSalary(monthly: number | null | undefined) {
  if (!monthly) return '—';
  return `₹${Number(monthly).toLocaleString('en-IN')}/mo (₹${(Number(monthly) * 12 / 100000).toFixed(2)}L/yr)`;
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
  if (n.candidate_decision) return `Decision: ${String(n.candidate_decision).replace(/_/g, ' ')}`;
  if (n.withdrawal_reason) return `Reason: ${String(n.withdrawal_reason)}`;
  if (n.reason) return `Reason: ${String(n.reason)}`;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const id = parseInt(params.id as string, 10);
  const { canEdit, canDelete } = usePermission();

  const [tab, setTab] = useState<Tab>('Overview');

  // Modal open states
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
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

  const { data: candidate, isLoading, isError } = useCandidate(id);
  const { data: activity, isLoading: activityLoading } = useCandidateActivity(id, tab === 'Activity');
  const deleteMutation = useDeleteCandidate();
  const resumeMutation = useUploadResume(id);

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

  const c = candidate;
  const statusColor = STATUS_COLORS[c.status as CandidateStatus];
  const hr = canEdit('recruitment');

  // ─── Status-driven action buttons ────────────────────────────────────────
  const renderActions = () => {
    const btns: React.ReactNode[] = [];

    btns.push(
      <button key="aptitude" className="btn btn-sec btn-sm" onClick={() => setAptitudeOpen(true)}>
        🧠 {c.aptitude_test_sent ? 'Resend Test' : 'Send Aptitude Test'}
      </button>
    );

    if (c.preinterview_form_status === 'Submitted' && hr) {
      btns.push(
        <button key="forms" className="btn btn-sec btn-sm" onClick={() => router.push(`/ats/${id}/forms`)}>
          View Forms
        </button>
      );
    }

    if (c.status === 'Shortlisted' && hr) {
      btns.push(
        <button key="schedule" className="btn btn-sec btn-sm" onClick={() => setScheduleOpen(true)}>
          📅 Schedule Interview
        </button>
      );
    }

    if (c.status === 'Interview_Scheduled' && hr) {
      btns.push(
        <button key="reschedule" className="btn btn-sec btn-sm" onClick={() => setScheduleOpen(true)}>
          📅 Reschedule
        </button>
      );
      if (c.interview_accepted === true) {
        btns.push(
          <button
            key="preform"
            className="btn btn-sec btn-sm"
            style={c.pre_interview_form_sent ? { color: 'var(--green)', borderColor: 'var(--green-bd)' } : {}}
            onClick={() => setPreFormOpen(true)}
          >
            📋 {c.pre_interview_form_sent ? 'Resend Pre-Interview Form' : 'Send Pre-Interview Form'}
          </button>
        );
      }
    }

    if (c.status === 'Interview_Result' && hr) {
      btns.push(
        <button
          key="result"
          className="btn btn-pri btn-sm"
          style={{ background: 'var(--teal)', borderColor: 'var(--teal)' }}
          onClick={() => setResultOpen(true)}
        >
          🎯 Record Result
        </button>
      );
    }

    if (c.status === 'Offered' && hr) {
      btns.push(
        <button key="offer" className="btn btn-sec btn-sm" onClick={() => setOfferOpen(true)}>
          ✉ {c.offer_sent_at ? 'Resend Offer' : 'Send Offer Letter'}
        </button>
      );
      btns.push(
        <button
          key="hire"
          className="btn btn-pri btn-sm"
          style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
          onClick={() => setHireOpen(true)}
        >
          🎉 Confirm Hire
        </button>
      );
    }

    return btns;
  };

  // ─── Tab: Overview ──────────────────────────────────────────────────────────
  const OverviewTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Personal Details">
          <InfoRow label="Email" value={c.email ? <a href={`mailto:${c.email}`} style={{ color: 'var(--blue)' }}>{c.email}</a> : null} />
          <InfoRow label="Phone" value={c.phone_number ? <a href={`tel:${c.phone_number}`} style={{ color: 'var(--blue)' }}>{c.phone_number}</a> : null} />
          <InfoRow label="Gender" value={c.gender} />
          <InfoRow label="Date of Birth" value={formatDate(c.date_of_birth)} />
          <InfoRow label="Location" value={c.location} />
          <InfoRow label="Ready to Relocate" value={c.ready_to_relocate == null ? null : c.ready_to_relocate ? '✓ Yes' : '✗ No'} />
          <InfoRow label="Permanent Address" value={c.perm_address_same_as_present === false ? 'Different from present' : 'Same as present'} />
          <InfoRow label="Own Vehicle" value={c.own_vehicle ? (asArray(c.vehicle_types).length ? `✓ ${asArray(c.vehicle_types).join(', ')}` : '✓ Yes') : '✗ No'} />
        </SectionCard>

        <SectionCard title="Sourcing">
          <InfoRow label="Source" value={c.source ? `${SOURCE_EMOJI[c.source] || ''} ${c.source}` : null} />
          <InfoRow label="Internal Referral" value={c.is_internal_referral == null ? null : c.is_internal_referral ? '✓ Yes' : '✗ No'} />
          {c.is_internal_referral && c.referred_by_employee_id != null && (
            <InfoRow label="Referred By" value={`Employee #${c.referred_by_employee_id}`} />
          )}
          <InfoRow label="Reference" value={c.reference_source} />
          {c.remarks && (
            <div style={{ marginTop: 8, background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 12, color: 'var(--ink)', lineHeight: 1.6 }}>
              {c.remarks}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Record">
          <InfoRow label="Reference Code" value={c.reference_code} />
          <InfoRow label="Added" value={formatDate(c.created_at)} />
          <InfoRow label="Updated" value={formatDate(c.updated_at)} />
        </SectionCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Compensation">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 4 }}>Current (monthly)</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--ink)' }}>
                {c.current_salary ? `₹${Number(c.current_salary).toLocaleString('en-IN')}` : '—'}
              </div>
              {c.current_salary && <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 2 }}>₹{(Number(c.current_salary) * 12 / 100000).toFixed(2)}L/yr</div>}
            </div>
            <div style={{ background: 'var(--green-lt)', border: '1px solid var(--green-bd)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 4 }}>Expected (monthly)</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--green)' }}>
                {c.expected_salary ? `₹${Number(c.expected_salary).toLocaleString('en-IN')}` : '—'}
              </div>
              {c.expected_salary && <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 2 }}>₹{(Number(c.expected_salary) * 12 / 100000).toFixed(2)}L/yr</div>}
            </div>
          </div>
          {c.current_salary && c.expected_salary ? (() => {
            const cur = Number(c.current_salary); const exp = Number(c.expected_salary);
            const hike = (((exp - cur) / cur) * 100).toFixed(1);
            return (
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ink4)' }}>Hike expectation</span>
                <strong style={{ fontFamily: 'var(--mono)', color: exp > cur ? 'var(--green)' : 'var(--red)' }}>
                  {Number(hike) >= 0 ? '+' : ''}{hike}%
                </strong>
              </div>
            );
          })() : null}
        </SectionCard>

        <SectionCard title="Availability">
          <InfoRow label="Currently Working" value={c.currently_working == null ? null : c.currently_working ? '✓ Yes' : '✗ No'} />
          <InfoRow label="Serving Notice" value={c.serving_notice_period == null ? null : c.serving_notice_period ? '✓ Yes' : '✗ No'} />
          <InfoRow label="Last Working Day" value={formatDate(c.last_working_day)} />
          <InfoRow label="Notice Period" value={c.notice_period != null ? `${c.notice_period} days` : null} />
          <InfoRow label="Expected Joining" value={formatDate(c.expected_joining_date)} />
          <InfoRow label="Immediate Joiner" value={
            <span style={{ color: c.immediate_joiner ? 'var(--green)' : 'var(--ink4)', fontWeight: 700 }}>
              {c.immediate_joiner ? '⚡ Yes' : '✗ No'}
            </span>
          } />
        </SectionCard>
      </div>
    </div>
  );

  // ─── Tab: Experience ───────────────────────────────────────────────────────
  const ExperienceTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Work Experience">
          <InfoRow label="Fresher" value={c.fresher ? '✓ Yes' : '✗ No'} />
          <InfoRow label="Current Company" value={c.current_company_name} />
          <InfoRow label="Current Designation" value={c.current_company_designation} />
          <InfoRow label="Total Experience" value={c.total_experience != null ? `${c.total_experience} years` : null} />
          <InfoRow label="Relevant Experience" value={c.relevant_experience != null ? `${c.relevant_experience} years` : null} />
        </SectionCard>

        <SectionCard title="Applying For">
          <InfoRow label="Department" value={c.apply_department} />
          <InfoRow label="Designation" value={c.apply_designation} />
        </SectionCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Education">
          <InfoRow label="Qualification" value={c.qualification} />
          <InfoRow label="Course" value={c.course} />
          <InfoRow label="Institute" value={c.institute} />
          <InfoRow label="Mode" value={c.edu_mode} />
          <InfoRow label="Period" value={
            c.edu_start_date || c.edu_end_date || c.edu_currently_pursuing
              ? `${formatDate(c.edu_start_date) || '—'} → ${c.edu_currently_pursuing ? 'Present' : (formatDate(c.edu_end_date) || '—')}`
              : null
          } />
        </SectionCard>

        <SectionCard title="Employment History">
          {c.employments?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.employments.map((emp, i) => (
                <div key={emp.id ?? i} style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '10px 12px', fontSize: 12, lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    {emp.company}{emp.designation ? ` · ${emp.designation}` : ''}
                    {emp.currently_working && <span style={{ marginLeft: 6 }}><Chip variant="green">Current</Chip></span>}
                  </div>
                  <div style={{ color: 'var(--ink4)' }}>
                    {formatDate(emp.joining_date) || '—'} → {emp.currently_working ? 'Present' : (formatDate(emp.leaving_date) || '—')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '6px 0' }}>No employment history recorded</div>
          )}
        </SectionCard>
      </div>
    </div>
  );

  // ─── Tab: Interviews ───────────────────────────────────────────────────────
  const noInterviewYet = !c.interview_date && !c.candidate_decision && !c.reschedule_requested;
  const InterviewsTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {c.interview_date ? (
          <SectionCard
            title="📅 Interview Scheduled"
            action={hr && <button className="btn btn-sec btn-sm" onClick={() => setScheduleOpen(true)}>Reschedule</button>}
          >
            <InfoRow label="Date" value={formatDate(c.interview_date)} />
            <InfoRow label="Time" value={c.interview_time || '—'} />
            <InfoRow label="Format" value={c.interview_type || '—'} />
            <InfoRow label="Response" value={
              c.interview_accepted === null || c.interview_accepted === undefined ? <Chip variant="amber">Awaiting</Chip> :
                c.interview_accepted ? <Chip variant="green">Accepted ✓</Chip> :
                  <Chip variant="red">Declined ✗</Chip>
            } />
            {c.interview_link && (
              <div style={{ marginTop: 8 }}>
                <a href={c.interview_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                  🔗 Join Interview →
                </a>
              </div>
            )}
            {c.interview_instructions && (
              <div style={{ marginTop: 10, background: 'var(--blue-lt)', border: '1px solid var(--blue-md)', borderRadius: 'var(--r)', padding: '8px 12px', fontSize: 11, color: 'var(--blue)' }}>
                {c.interview_instructions}
              </div>
            )}
            {c.interview_accepted === true && hr && (
              <button className="btn btn-sec btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => setPreFormOpen(true)}>
                📋 {c.pre_interview_form_sent ? 'Resend Pre-Interview Form' : 'Send Pre-Interview Form'}
              </button>
            )}
          </SectionCard>
        ) : null}

        {c.reschedule_requested && c.reschedule_status === 'Pending' && (
          <SectionCard title="🔄 Reschedule Requested">
            <InfoRow label="Reason" value={c.reschedule_reason} />
            <InfoRow label="Proposed date" value={c.reschedule_proposed_date ? `${formatDate(c.reschedule_proposed_date)} ${c.reschedule_proposed_time || ''}` : null} />
            {hr && (
              <button className="btn btn-sec btn-sm" style={{ marginTop: 10 }} onClick={() => setScheduleOpen(true)}>
                ✓ Approve &amp; Reschedule
              </button>
            )}
          </SectionCard>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {c.candidate_decision ? (
          <SectionCard title={`${c.candidate_decision === 'Select' ? '✓ Selected' : c.candidate_decision === 'Reject' ? '✗ Rejected' : '⏸ On Hold'} — Interview Result`}>
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
          </SectionCard>
        ) : null}

        <SectionCard
          title="Aptitude Test"
          action={hr && <button className="btn btn-sec btn-sm" onClick={() => setAptitudeOpen(true)}>{c.aptitude_test_sent ? 'Resend' : 'Send'}</button>}
        >
          <InfoRow label="Test sent" value={
            c.aptitude_test_sent
              ? <Chip variant="green">✓ Sent {c.aptitude_test_sent_at ? formatDate(c.aptitude_test_sent_at) : ''}</Chip>
              : <Chip variant="gray">Not sent</Chip>
          } />
          {c.aptitude_attempted_at ? (
            <>
              <InfoRow label="Attempted" value={formatDate(c.aptitude_attempted_at)} />
              <InfoRow label="Score (HR only)" value={
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>{c.aptitude_score ?? '—'}</span>
              } />
              {c.aptitude_time_taken != null && (
                <InfoRow label="Time taken" value={`${Math.floor(c.aptitude_time_taken / 60)}m ${c.aptitude_time_taken % 60}s`} />
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '6px 0' }}>Not attempted yet</div>
          )}
        </SectionCard>
      </div>

      {noInterviewYet && (
        <div style={{ gridColumn: '1 / -1' }}>
          <EmptyState>
            No interview scheduled yet.
            {c.status === 'Shortlisted' && hr && (
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-pri btn-sm" onClick={() => setScheduleOpen(true)}>📅 Schedule Interview</button>
              </div>
            )}
          </EmptyState>
        </div>
      )}
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

  const DocsTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard title="Resume">
          {c.resume_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Resume on file</div>
                <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${c.resume_url}`}
                  target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--blue)' }}>
                  View / Download →
                </a>
              </div>
              {hr && resumeInput('Replace')}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 12, color: 'var(--ink4)', marginBottom: 10 }}>No Resume uploaded</div>
              {hr && resumeInput('↑ Upload Resume')}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Forms"
          action={c.preinterview_form_status === 'Submitted' && hr && (
            <button className="btn btn-sec btn-sm" onClick={() => router.push(`/ats/${id}/forms`)}>View Forms</button>
          )}
        >
          <InfoRow label="Pre-interview form" value={
            <Chip variant={c.preinterview_form_status === 'Submitted' ? 'green' : c.preinterview_form_status === 'Draft' ? 'amber' : 'gray'}>
              {c.preinterview_form_status === 'Submitted' ? '✓ Submitted' : c.preinterview_form_status === 'Draft' ? '📝 Draft' : 'Not started'}
            </Chip>
          } />
          <InfoRow label="Pre-interview sent" value={
            c.pre_interview_form_sent
              ? <Chip variant="green">✓ Sent {c.pre_interview_form_sent_at ? formatDate(c.pre_interview_form_sent_at) : ''}</Chip>
              : <Chip variant="gray">Not sent</Chip>
          } />
          <InfoRow label="Pre-joining form" value={
            <Chip variant={c.prejoining_form_status === 'Submitted' ? 'green' : c.prejoining_form_status === 'Draft' ? 'amber' : 'gray'}>
              {c.prejoining_form_status === 'Submitted' ? '✓ Submitted' : c.prejoining_form_status === 'Draft' ? '📝 Draft' : 'Not started'}
            </Chip>
          } />
          <InfoRow label="Pre-joining sent" value={
            c.pre_joining_form_sent
              ? <Chip variant="green">✓ Sent {c.pre_joining_form_sent_at ? formatDate(c.pre_joining_form_sent_at) : ''}</Chip>
              : <Chip variant="gray">Not sent</Chip>
          } />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {c.interview_accepted === true && hr && (
              <button className="btn btn-sec btn-sm" onClick={() => setPreFormOpen(true)}>
                📋 {c.pre_interview_form_sent ? 'Resend Pre-Interview' : 'Send Pre-Interview'}
              </button>
            )}
            {c.status === 'Offered' && hr && (
              <button className="btn btn-sec btn-sm" onClick={() => setPreJoiningOpen(true)}>
                📝 {c.prejoining_form_status === 'Submitted' ? 'Resend Pre-Joining' : c.pre_joining_form_sent ? 'Resend Link' : 'Send Pre-Joining'}
              </button>
            )}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionCard
          title="Candidate Portal"
          action={hr && (
            <button className="btn btn-sec btn-sm" onClick={() => setPortalOpen(true)}>
              {c.is_portal_user ? '🔑 Reset Password' : '🌐 Grant Access'}
            </button>
          )}
        >
          <InfoRow label="Portal access" value={<Chip variant={c.is_portal_user ? 'green' : 'gray'}>{c.is_portal_user ? '✓ Active' : 'Not granted'}</Chip>} />
          {c.portal_last_login && <InfoRow label="Last login" value={formatDate(c.portal_last_login)} />}
        </SectionCard>
      </div>
    </div>
  );

  // ─── Tab: Offers ───────────────────────────────────────────────────────────
  const hasOfferContent = c.status === 'Offered' || c.status === 'Hired' || c.status === 'Withdrawn' || c.offer_sent_at;
  const OffersTab = (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(c.status === 'Offered' || c.status === 'Hired' || c.offer_sent_at) ? (
          <SectionCard
            title="✉ Offer Details"
            action={c.status === 'Offered' && hr && (
              <button className="btn btn-sec btn-sm" onClick={() => setOfferOpen(true)}>
                {c.offer_sent_at ? 'Resend Offer' : 'Send Offer'}
              </button>
            )}
          >
            <InfoRow label="Offered CTC (mo)" value={c.offered_ctc ? fmtSalary(c.offered_ctc) : null} />
            <InfoRow label="Joining date" value={formatDate(c.confirmed_joining_date)} />
            <InfoRow label="Offer valid till" value={c.offer_valid_till ? new Date(c.offer_valid_till).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null} />
            <InfoRow label="Offer sent" value={c.offer_sent_at ? new Date(c.offer_sent_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            {c.offer_letter_url && (
              <div style={{ marginTop: 8 }}>
                <a href={c.offer_letter_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>
                  📄 View Offer Letter →
                </a>
              </div>
            )}
            {c.status === 'Offered' && hr && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {!c.offer_sent_at && (
                  <button className="btn btn-pri btn-sm" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={() => setOfferOpen(true)}>
                    ✉ Send Offer Letter
                  </button>
                )}
                <button className="btn btn-pri btn-sm" onClick={() => setHireOpen(true)}>🎉 Confirm Hire</button>
              </div>
            )}
          </SectionCard>
        ) : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {c.status === 'Hired' && c.hired_at && (
          <SectionCard title="🎉 Hired">
            <InfoRow label="Hired on" value={new Date(c.hired_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
            {c.converted_employee_id && (
              <button className="btn btn-sec btn-sm" style={{ marginTop: 10 }} onClick={() => router.push(`/employees/${c.converted_employee_id}`)}>
                👤 View Employee Record →
              </button>
            )}
          </SectionCard>
        )}

        {c.status === 'Withdrawn' && (
          <SectionCard title="✗ Withdrawn">
            <InfoRow label="Withdrawn on" value={c.withdrawn_at ? new Date(c.withdrawn_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null} />
            {c.withdrawal_reason && (
              <div style={{ fontSize: 12, color: 'var(--ink3)', lineHeight: 1.6, background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '8px 12px', marginTop: 8 }}>
                {c.withdrawal_reason}
              </div>
            )}
            {hr && (
              <button className="btn btn-sec btn-sm" style={{ marginTop: 10 }} onClick={() => setMoveOpen(true)}>↩ Re-activate</button>
            )}
          </SectionCard>
        )}
      </div>

      {!hasOfferContent && (
        <div style={{ gridColumn: '1 / -1' }}>
          <EmptyState>No offer has been made for this candidate yet.</EmptyState>
        </div>
      )}
    </div>
  );

  // ─── Tab: Activity ─────────────────────────────────────────────────────────
  const ActivityTab = (
    <div className="card cp">
      {activityLoading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink4)', fontSize: 12 }}>Loading activity…</div>
      ) : !activity?.length ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink4)', fontSize: 12 }}>No activity recorded</div>
      ) : (
        <div className="tl">
          {activity.map(a => {
            const detail = activityDetail(a.old_values, a.new_values);
            return (
              <div className="tl-item" key={a.id}>
                <span className="tl-dot td-b" />
                <div className="tl-ttl">{ACTIVITY_LABELS[a.action] || a.action.replace(/_/g, ' ')}</div>
                <div className="tl-sub">
                  {new Date(a.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {' · '}{a.actor_name}
                  {detail ? <> · <span style={{ color: 'var(--ink3)' }}>{detail}</span></> : null}
                </div>
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

  return (
    <PermissionGuard permission="recruitment:view">
      <AppShell>
        <div className="pg-enter">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="ph">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 13, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                color: '#fff', fontWeight: 700, fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {(c.candidate_name || '').trim().split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || '?'}
              </div>
              <div>
                <h1 style={{ marginBottom: 6 }}>{c.candidate_name}</h1>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {statusColor && (
                    <span style={{
                      background: statusColor.bg, color: statusColor.text,
                      border: `1px solid ${statusColor.border}`,
                      borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                    }}>
                      {STATUS_LABEL[c.status as CandidateStatus] || c.status}
                    </span>
                  )}
                  {c.reference_code && <span style={{ fontSize: 11, color: 'var(--ink4)', fontFamily: 'var(--mono)' }}>{c.reference_code}</span>}
                  {c.source && <Chip variant="blue">{SOURCE_EMOJI[c.source] || ''} {c.source}</Chip>}
                  {c.immediate_joiner && <Chip variant="green">⚡ Immediate</Chip>}
                  {c.is_portal_user && <Chip variant="teal">🌐 Portal</Chip>}
                  {c.hired_at && c.converted_employee_id && (
                    <Chip variant="green" onClick={() => router.push(`/employees/${c.converted_employee_id}`)}>
                      👤 View Employee →
                    </Chip>
                  )}
                  {c.location && <span style={{ fontSize: 11, color: 'var(--ink4)' }}>📍 {c.location}</span>}
                </div>
              </div>
            </div>

            <div className="ph-r">
              <button className="btn btn-sec btn-sm" onClick={() => router.push('/ats')}>← Back</button>
              {hr && renderActions()}
              {hr && (
                <>
                  <button className="btn btn-sec btn-sm" onClick={() => setMoveOpen(true)}>Move Stage</button>
                  <button className="btn btn-sec btn-sm" onClick={() => setEditOpen(true)}>Edit</button>
                  {c.status !== 'Hired' && c.status !== 'Withdrawn' && (
                    <button className="btn btn-sec btn-sm" style={{ color: 'var(--amber)', borderColor: 'var(--amber-bd)' }} onClick={() => setWithdrawOpen(true)}>
                      Withdraw
                    </button>
                  )}
                </>
              )}
              {canDelete('recruitment') && (
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}>Delete</button>
              )}
            </div>
          </div>

          {/* ── Reschedule alert ───────────────────────────────────────── */}
          {c.reschedule_requested && c.reschedule_status === 'Pending' && hr && (
            <div style={{
              background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)',
              borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 12, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>
                  🔄 Reschedule Request Pending
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                  <strong>Reason:</strong> {c.reschedule_reason || '—'}
                  {c.reschedule_proposed_date && (
                    <span style={{ marginLeft: 12 }}>
                      <strong>Proposed:</strong> {formatDate(c.reschedule_proposed_date)} {c.reschedule_proposed_time || ''}
                    </span>
                  )}
                </div>
              </div>
              <button className="btn btn-sec btn-sm" onClick={() => setScheduleOpen(true)}>✓ Approve &amp; Reschedule</button>
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
        <StatusMoveModal open={moveOpen} onClose={() => setMoveOpen(false)} candidate={c} onInterviewResult={() => { setMoveOpen(false); setResultOpen(true); }} />
        <InterviewSchedulerModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} candidate={c} />
        <InterviewResultModal open={resultOpen} onClose={() => setResultOpen(false)} candidate={c} />
        <AptitudeTestSendModal open={aptitudeOpen} onClose={() => setAptitudeOpen(false)} candidate={c} />
        <GrantPortalAccessModal open={portalOpen} onClose={() => setPortalOpen(false)} candidate={c} />
        <PreJoiningFormModal open={preJoiningOpen} onClose={() => setPreJoiningOpen(false)} candidate={c} />
        <PreInterviewFormModal open={preFormOpen} onClose={() => setPreFormOpen(false)} candidate={c} />
        <OfferLetterModal open={offerOpen} onClose={() => setOfferOpen(false)} candidate={c} />
        <HireCandidateModal open={hireOpen} onClose={() => setHireOpen(false)} candidate={c} />
        <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} candidate={c} />

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
      </AppShell>
    </PermissionGuard>
  );
}
