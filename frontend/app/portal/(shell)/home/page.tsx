'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePortalProfile, usePortalDocuments } from '../../../../features/candidates/hooks/usePortal';
import { PortalStepper } from '../../../../features/candidates/components/portal/PortalStepper';
import {
  STATUS_LABEL, STATUS_TO_VIEW_STEP, VIEW_STAGE_STEPS,
  type CandidateStatus,
} from '../../../../features/candidates/types/candidate.types';
import { formatDate } from '../../../../utils/formatters';

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  return diff >= 0 ? diff : null;
}

export default function PortalHome() {
  const { data: c } = usePortalProfile();
  const { data: documents = [] } = usePortalDocuments();
  const [jdOpen, setJdOpen] = useState(false);

  if (!c) return null;

  const stepIdx = STATUS_TO_VIEW_STEP[c.status as CandidateStatus] ?? 0;
  const stageLabel = stepIdx >= 0 ? VIEW_STAGE_STEPS[stepIdx] : (STATUS_LABEL[c.status as CandidateStatus] || c.status);
  const roleName = c.job_title || c.apply_designation || 'your';
  const joinIn = daysUntil(c.confirmed_joining_date || c.decision_joining_date || c.expected_joining_date);
  const joinDate = c.confirmed_joining_date || c.decision_joining_date || c.expected_joining_date;

  const pendingReq   = documents.filter(d => d.kind === 'Request' && d.status === 'Pending');
  const pendingShare = documents.filter(d => d.kind === 'Share' && d.status === 'Pending');

  const todos: { text: string; href: string }[] = [];
  if (c.status === 'Interview' && c.interview_date && (c.interview_accepted === null || c.interview_accepted === undefined))
    todos.push({ text: 'Confirm your interview attendance', href: '/portal/interviews' });
  if (c.aptitude_test_sent && !c.aptitude_attempted_at)
    todos.push({ text: 'Complete your aptitude test', href: '/portal/assessments' });
  if (c.pre_interview_form_sent && c.status === 'Interview' && c.interview_accepted === true && c.preinterview_form_status !== 'Submitted')
    todos.push({ text: 'Fill in your pre-interview form', href: '/portal/pre-interview' });
  if (c.pre_joining_form_sent && c.prejoining_form_status !== 'Submitted')
    todos.push({ text: 'Complete your joining form', href: '/portal/joining' });
  if (pendingReq.length)
    todos.push({ text: `Provide ${pendingReq.length} requested document${pendingReq.length > 1 ? 's' : ''}`, href: '/portal/documents' });
  if (pendingShare.length)
    todos.push({ text: `Review ${pendingShare.length} new document${pendingShare.length > 1 ? 's' : ''} from HR`, href: '/portal/documents' });

  const roleMeta = [c.apply_department, c.job_location, c.job_type, c.job_code].filter(Boolean).join(' · ');

  return (
    <>
      {/* Greeting */}
      <div className="pc-card">
        <h1 className="pc-h1">Hi, {c.candidate_name.split(' ')[0]}</h1>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
          Here&rsquo;s what matters for your {roleName} application.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="pc-chip gry">Now: {stageLabel}</span>
          {c.job_description && (
            <button className="pc-btn pc-btn-sec pc-btn-sm" onClick={() => setJdOpen(o => !o)}>
              {jdOpen ? 'Hide JD' : 'View JD'}
            </button>
          )}
        </div>
        {jdOpen && c.job_description && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {c.job_description}
          </div>
        )}
      </div>

      {/* Role */}
      <div className="pc-card">
        <div className="pc-ct">
          Role you applied for
          {c.job_description && <span className="pc-ct-act" onClick={() => setJdOpen(true)}>View JD</span>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{c.job_title || c.apply_designation || '—'}</div>
        {roleMeta && <div className="pc-muted" style={{ marginTop: 3 }}>{roleMeta}</div>}
        {c.job_description && (
          <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.7, marginTop: 10 }}>
            {c.job_description.length > 220 ? c.job_description.slice(0, 220) + '…' : c.job_description}
          </div>
        )}
      </div>

      {/* Days until joining */}
      {joinIn != null && (
        <div className="pc-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#1e56d9', lineHeight: 1 }}>{joinIn}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Days until joining</div>
            <div className="pc-muted">{formatDate(joinDate)}</div>
          </div>
        </div>
      )}

      {/* What you need to do */}
      <div className="pc-k" style={{ margin: '6px 0 8px' }}>What you need to do</div>
      {todos.length === 0 ? (
        <div className="pc-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, border: '1px solid #86efac', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>✓</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5 }}>You&rsquo;re all caught up</div>
              <div className="pc-muted" style={{ margin: '2px 0 10px' }}>Nothing needs your attention right now. Check My progress anytime for updates.</div>
              <Link href="/portal/progress" className="pc-btn pc-btn-sec pc-btn-sm">See my progress</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="pc-card">
          {todos.map((t, i) => (
            <div key={i} className="pc-row">
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.text}</span>
              <Link href={t.href} className="pc-btn pc-btn-pri pc-btn-sm">Open →</Link>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="pc-card">
        <div className="pc-ct">
          Your progress
          <Link href="/portal/progress" className="pc-ct-act">See details</Link>
        </div>
        <PortalStepper status={c.status as CandidateStatus} createdAt={c.created_at} compact />
      </div>
    </>
  );
}
