'use client';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { Chip } from '../../../components/ui/Chip';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '../../../components/ui/Select';
import { CandidateFormModal } from '../../../features/candidates/components/CandidateFormModal';
import { BulkUploadModal } from '../../../features/candidates/components/BulkUploadModal';
import { StatusMoveModal } from '../../../features/candidates/components/StatusMoveModal';
import { InterviewSchedulerModal } from '../../../features/candidates/components/InterviewSchedulerModal';
import { InterviewResultModal } from '../../../features/candidates/components/InterviewResultModal';
import { OfferLetterModal } from '../../../features/candidates/components/OfferLetterModal';
import { WithdrawModal } from '../../../features/candidates/components/WithdrawModal';
import {
  useCandidates, useCandidateStats, useDeleteCandidate,
} from '../../../features/candidates/hooks/useCandidates';
import { usePermission } from '../../../features/auth/hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Candidate } from '../../../features/candidates/types/candidate.types';
import {
  ALL_STATUSES, ALL_SOURCES,
  STATUS_COLORS, STATUS_LABEL, SOURCE_EMOJI, PIPELINE_STAGES,
} from '../../../features/candidates/types/candidate.types';
import { formatDate } from '../../../utils/formatters';
import { PermissionGuard } from '../../../utils/permissionGuard';

// ─── Relative-time helpers ───────────────────────────────────────────────────
function addedAgo(d?: string | null): string {
  if (!d) return '—';
  const dt = new Date(d); const now = new Date();
  const days = Math.floor((now.getTime() - dt.getTime()) / 86400000);
  if (dt.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (dt.toDateString() === y.toDateString()) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 35) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
function fullStamp(d: string): string {
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }).replace(',', ' ·').replace(/\s?([ap]m)$/i, (_m, p) => ` ${p.toLowerCase()}`);
}
function updatedAgo(d?: string | null): string {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fullStamp(d);
}

const SORT_OPTIONS: { key: string; label: string; sort: string; order: 'ASC' | 'DESC' }[] = [
  { key: 'newest',  label: 'Newest first',            sort: 'created_at',      order: 'DESC' },
  { key: 'oldest',  label: 'Oldest first',            sort: 'created_at',      order: 'ASC'  },
  { key: 'updated', label: 'Recently updated',        sort: 'updated_at',      order: 'DESC' },
  { key: 'name',    label: 'Name A–Z',                sort: 'candidate_name',  order: 'ASC'  },
  { key: 'exp',     label: 'Experience: high to low', sort: 'total_experience', order: 'DESC' },
];

const PAGE_SIZE = 20;

const SELECT_STYLE: React.CSSProperties = {
  background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)',
  padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font)', outline: 'none', color: 'var(--ink)',
};

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === 'string' && v.trim()) {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; }
    catch { return v.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
}

export default function ATSPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { canEdit, canDelete, canCreate, canDownload } = usePermission();

  const [tab, setTab] = useState<'list' | 'pipeline' | 'triggers'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<Candidate[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Candidate | null>(null);
  const [moveTarget, setMoveTarget] = useState<Candidate | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<Candidate | null>(null);
  const [resultTarget, setResultTarget] = useState<Candidate | null>(null);
  const [offerTarget, setOfferTarget] = useState<Candidate | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Candidate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Candidate | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 380);
  const deleteMutation = useDeleteCandidate();
  const sortOpt = SORT_OPTIONS.find(o => o.key === sortKey)!;

  const { data, isLoading } = useCandidates({
    page, limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    role: roleFilter || undefined,
    sort: sortOpt.sort,
    order: sortOpt.order,
  });

  const { data: stats } = useCandidateStats();
  const candidates = data?.data ?? [];
  const meta = (data as any)?.meta;
  const total = meta?.total ?? candidates.length;
  const totalPages = meta?.totalPages ?? 1;

  // Fully controlled "select all" — header checkbox state + toggle computed here
  // (by id) so it stays in sync with the rows across pagination / search / filter
  // and preserves picks made on other pages.
  const selectedIds = new Set(selection.map((c) => c.id));
  const allSelected = candidates.length > 0 && candidates.every((c: Candidate) => selectedIds.has(c.id));
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelection([...selection, ...candidates.filter((c: Candidate) => !selectedIds.has(c.id))]);
    } else {
      const pageIds = new Set(candidates.map((c: Candidate) => c.id));
      setSelection(selection.filter((c) => !pageIds.has(c.id)));
    }
  };

  useEffect(() => {
    dispatch(setPageTitle({ title: 'ATS — Sourcing & Pipeline', breadcrumb: 'Recruitment' }));
  }, [dispatch]);

  // Keep the current page in range when filters / deletions shrink the result set.
  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(totalPages);
  }, [page, totalPages]);

  // Distinct role options from what's loaded (+ keep the active filter selectable).
  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => { const r = c.job_title || c.apply_designation; if (r) set.add(r); });
    if (roleFilter) set.add(roleFilter);
    return [...set].sort();
  }, [candidates, roleFilter]);

  const srcCount = (s: string) => stats?.sources?.find(x => x.source === s)?.count ?? 0;
  const hasFilters = !!(search || statusFilter || sourceFilter || roleFilter);
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setSourceFilter(''); setRoleFilter(''); setPage(1); };

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (c: Candidate) => { setEditTarget(c); setFormOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };
  const handleBulkDelete = async () => {
    for (const c of selection) { try { await deleteMutation.mutateAsync(c.id); } catch { /* continue */ } }
    setSelection([]); setBulkDeleteOpen(false);
  };

  // ─── Status pill ─────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => {
    const c = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
    const label = STATUS_LABEL[status as keyof typeof STATUS_LABEL] || status;
    if (!c) return <Chip variant="gray">{label}</Chip>;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center',
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    );
  };

  // ─── Kanban (Pipeline tab) ───────────────────────────────────────────────
  const KanbanBoard = () => {
    const grouped = PIPELINE_STAGES.reduce((acc, s) => {
      acc[s] = candidates.filter(c => c.status === s);
      return acc;
    }, {} as Record<string, Candidate[]>);

    return (
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
        {PIPELINE_STAGES.map(stage => {
          const col = STATUS_COLORS[stage];
          const cards = grouped[stage] || [];
          return (
            <div key={stage} style={{ minWidth: 220, maxWidth: 240, flexShrink: 0 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px',
                background: col.bg, border: `1px solid ${col.border}`, borderRadius: 'var(--r) var(--r) 0 0',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: col.text }}>{STATUS_LABEL[stage] || stage}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', background: col.text, color: '#fff', borderRadius: 99, padding: '1px 7px' }}>
                  {cards.length}
                </span>
              </div>
              <div style={{
                background: 'var(--surface2)', border: `1px solid ${col.border}`, borderTop: 'none',
                borderRadius: '0 0 var(--r) var(--r)', minHeight: 100, padding: 8,
                display: 'flex', flexDirection: 'column', gap: 7,
              }}>
                {cards.map(c => (
                  <div key={c.id}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '10px 11px', cursor: 'pointer', boxShadow: 'var(--sh)' }}
                    onClick={() => router.push(`/ats/${c.id}`)}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.candidate_name}
                    </div>
                    {(c.job_title || c.current_company_name) && (
                      <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.job_title || c.current_company_name}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {c.total_experience != null && <span style={{ fontSize: 10, color: 'var(--ink4)' }}>{c.total_experience}yr</span>}
                      {c.source && <span style={{ fontSize: 10 }}>{SOURCE_EMOJI[c.source] || ''}</span>}
                      {c.resume_url && <span style={{ fontSize: 10 }} title="Resume available">📄</span>}
                      {c.status === 'Interview' && c.interview_date && (
                        <span style={{ fontSize: 9, color: 'var(--purple)', fontWeight: 700 }}>📅 {formatDate(c.interview_date)}</span>
                      )}
                    </div>
                    {c.status === 'Interview' && canEdit('recruitment') && (
                      <button type="button" onClick={e => { e.stopPropagation(); setResultTarget(c); }}
                        style={{ marginTop: 6, width: '100%', padding: '4px 0', background: 'var(--teal-lt)', border: '1px solid var(--teal-bd)', borderRadius: 5, fontSize: 10, color: 'var(--teal)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>
                        🎯 Record Result
                      </button>
                    )}
                    {canEdit('recruitment') && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setMoveTarget(c)}
                          style={{ flex: 1, padding: '3px 0', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 10, color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                          Move →
                        </button>
                        <button type="button" onClick={() => setScheduleTarget(c)}
                          style={{ padding: '3px 6px', background: 'var(--purple-lt)', border: '1px solid var(--purple-bd)', borderRadius: 5, fontSize: 10, color: 'var(--purple)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                          📅
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {cards.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: 'var(--ink4)' }}>Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PermissionGuard permission="recruitment:view">
      <AppShell>
        <div className="pg-enter">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="ph">
            <div>
              <h1>ATS — Sourcing &amp; Pipeline</h1>
              <p>Candidate list, kanban pipeline · Naukri / LinkedIn / CollarCheck · Bulk resume parse</p>
            </div>
            <div className="ph-r">
              {canDownload('recruitment') && (
                <button className="btn btn-sec btn-sm" onClick={() => setBulkOpen(true)}>🗁 Bulk Upload</button>
              )}
              <button className="btn btn-sec btn-sm" onClick={() => setTab('pipeline')}>▤ Pipeline</button>
              {canCreate('recruitment') && (
                <button className="btn btn-pri btn-sm" onClick={openCreate}>+ Add Candidate</button>
              )}
            </div>
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────── */}
          <div className="tabs" style={{ marginBottom: 14 }}>
            {([['list', '☰ List'], ['pipeline', '▤ Pipeline'], ['triggers', '⚡ Triggers & Templates']] as const).map(([k, label]) => (
              <div key={k} className={`tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{label}</div>
            ))}
          </div>

          {/* ── Integration banner ──────────────────────────────────────── */}
          <div style={{
            background: 'var(--amber-lt)', border: '1px solid var(--amber-bd)', borderRadius: 'var(--r)',
            padding: '9px 14px', marginBottom: 14, fontSize: 12, color: 'var(--amber)', fontWeight: 500,
          }}>
            🏷 Integration Active: Naukri synced 2h ago · LinkedIn webhook live · CollarCheck polling every 6h · Resume parser ready
          </div>

          {/* ── Source cards ────────────────────────────────────────────── */}
          <div className="g4 mb14">
            <StatCard label="Naukri"      value={srcCount('Naukri')}     color="var(--blue)"   chip={<Chip variant="blue">API sync</Chip>} />
            <StatCard label="LinkedIn"    value={srcCount('LinkedIn')}   color="var(--pink)"   chip={<Chip variant="pink">Webhook</Chip>} />
            <StatCard label="CollarCheck" value={srcCount('CollarCheck')} color="var(--teal)"  chip={<Chip variant="teal">Poll</Chip>} />
            <StatCard label="Referrals"   value={srcCount('Referral')}   color="var(--green)"  chip={<Chip variant="green">Sources</Chip>} />
          </div>

          {/* ── Pipeline tab ────────────────────────────────────────────── */}
          {tab === 'pipeline' && <KanbanBoard />}

          {/* ── Triggers & Templates tab ───────────────────────────────── */}
          {tab === 'triggers' && (
            <div className="card cp" style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.8 }}>
              <div className="ct">Triggers &amp; Templates</div>
              <p style={{ color: 'var(--ink4)', fontSize: 12 }}>
                Automated stage-move emails, interview invites, offer letters and pre-joining reminders are
                configured per company. Manage the message templates and their triggers from
                <strong> Settings → Email Templates</strong>.
              </p>
              <button className="btn btn-sec btn-sm" style={{ marginTop: 10 }} onClick={() => router.push('/settings/email-templates')}>
                Open Email Templates →
              </button>
            </div>
          )}

          {/* ── List tab ───────────────────────────────────────────────── */}
          {tab === 'list' && (
            <div className="card cp">
              {/* Card header: title + filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                  All Candidates <span style={{ color: 'var(--ink4)', fontWeight: 500 }}>· {total}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div className="search-bar" style={{ maxWidth: 230 }}>
                    <span style={{ color: 'var(--ink4)' }}>⌕</span>
                    <input type="text" placeholder="Search name, email, ID…" value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }} />
                  </div>
                  <Select
                    value={roleFilter}
                    onChange={v => { setRoleFilter(String(v)); setPage(1); }}
                    allLabel="All Roles"
                    filter
                    options={roleOptions.map(r => ({ value: r, label: r }))}
                  />
                  <Select
                    value={statusFilter}
                    onChange={v => { setStatusFilter(String(v)); setPage(1); }}
                    allLabel="All Statuses"
                    options={ALL_STATUSES.map(s => ({ value: s, label: STATUS_LABEL[s] || s }))}
                  />
                  <Select
                    value={sourceFilter}
                    onChange={v => { setSourceFilter(String(v)); setPage(1); }}
                    allLabel="All Sources"
                    options={ALL_SOURCES.map(s => ({ value: s, label: `${SOURCE_EMOJI[s]} ${s}` }))}
                  />
                  <Select
                    value={sortKey}
                    onChange={v => { setSortKey(String(v)); setPage(1); }}
                    options={SORT_OPTIONS.map(o => ({ value: o.key, label: o.label }))}
                  />
                  <button className="btn btn-sec btn-sm" onClick={clearFilters} disabled={!hasFilters}>Clear</button>
                </div>
              </div>

              {/* Bulk selection bar */}
              {selection.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
                  background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '7px 12px',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{selection.length} selected</span>
                  {canDelete('recruitment') && (
                    <button className="btn btn-danger btn-sm" onClick={() => setBulkDeleteOpen(true)}>Delete</button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelection([])}>Clear</button>
                </div>
              )}

              <DataTable
                value={candidates}
                loading={isLoading}
                rowHover
                dataKey="id"
                selectionMode="checkbox"
                selection={selection}
                selectAll={allSelected}
                onSelectAllChange={(e) => handleSelectAll(e.checked)}
                onSelectionChange={(e) => setSelection((e.value ?? []) as Candidate[])}
                emptyMessage="No candidates found"
                tableStyle={{ minWidth: '1100px' }}
                className="p-datatable-sm"
                onRowClick={(e) => router.push(`/ats/${(e.data as Candidate).id}`)}
              >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                <Column header="Candidate" body={(c: Candidate) => (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.candidate_name}</span>
                      <Eye size={13} style={{ color: 'var(--ink4)', flexShrink: 0 }} />
                      {c.immediate_joiner && <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 700 }}>⚡</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 1 }}>
                      {c.reference_code && <span style={{ fontFamily: 'var(--mono)' }}>{c.reference_code}</span>}
                      {c.email && <> · {c.email}</>}
                    </div>
                  </div>
                )} />

                <Column header="Role" body={(c: Candidate) => (
                  <span style={{ fontSize: 12, color: c.job_title || c.apply_designation ? 'var(--ink)' : 'var(--ink4)' }}>
                    {c.job_title || c.apply_designation || '—'}
                  </span>
                )} />

                <Column header="Source" body={(c: Candidate) => (
                  c.source
                    ? <Chip variant="blue">{SOURCE_EMOJI[c.source] || ''} {c.source}</Chip>
                    : <span style={{ color: 'var(--ink4)' }}>—</span>
                )} />

                <Column header="Exp" body={(c: Candidate) => (
                  <span style={{ fontSize: 12 }}>
                    {c.total_experience != null ? `${c.total_experience} yrs` : <span style={{ color: 'var(--ink4)' }}>—</span>}
                  </span>
                )} />

                <Column header="Skills" style={{ minWidth: 160 }} body={(c: Candidate) => {
                  const sk = toArr(c.skills);
                  if (!sk.length) return <span style={{ color: 'var(--ink4)' }}>—</span>;
                  return (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {sk.slice(0, 3).map(s => <Chip key={s} variant="gray">{s}</Chip>)}
                      {sk.length > 3 && <span style={{ fontSize: 10, color: 'var(--ink4)', alignSelf: 'center' }}>+{sk.length - 3}</span>}
                    </div>
                  );
                }} />

                <Column header="Status" body={(c: Candidate) => <StatusBadge status={c.status} />} />

                <Column header="Resume" body={(c: Candidate) => (
                  <div onClick={(e) => e.stopPropagation()}>
                    {c.resume_url ? (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${c.resume_url}`}
                        target="_blank" rel="noopener noreferrer" className="btn btn-sec btn-sm">
                        📄 View
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--ink4)' }}>—</span>
                    )}
                  </div>
                )} />

                <Column header={sortKey === 'newest' ? 'Added ↓' : sortKey === 'oldest' ? 'Added ↑' : 'Added'}
                  body={(c: Candidate) => (
                    <span style={{ fontSize: 11, color: 'var(--ink4)' }} title={c.created_at ? fullStamp(c.created_at) : ''}>
                      {addedAgo(c.created_at)}
                    </span>
                  )} />

                <Column header={sortKey === 'updated' ? 'Updated ↓' : 'Updated'}
                  body={(c: Candidate) => (
                    <span style={{ fontSize: 11, color: 'var(--ink4)' }} title={c.updated_at ? fullStamp(c.updated_at) : ''}>
                      {updatedAgo(c.updated_at)}
                    </span>
                  )} />

                <Column headerStyle={{ textAlign: 'right' }} body={(c: Candidate) => (
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                    {canEdit('recruitment') && (
                      <span title="Edit" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink4)', cursor: 'pointer' }} onClick={() => openEdit(c)}>Edit</span>
                    )}
                    {canDelete('recruitment') && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', cursor: 'pointer' }} onClick={() => setDeleteTarget(c)}>Delete</span>
                    )}
                  </div>
                )} />
              </DataTable>

              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

        {/* ── Modals ─────────────────────────────────────────────────────── */}
        <CandidateFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} candidate={editTarget} />
        <BulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
        <StatusMoveModal open={!!moveTarget} onClose={() => setMoveTarget(null)} candidate={moveTarget} />
        <InterviewSchedulerModal open={!!scheduleTarget} onClose={() => setScheduleTarget(null)} candidate={scheduleTarget} />
        <InterviewResultModal open={!!resultTarget} onClose={() => setResultTarget(null)} candidate={resultTarget} />
        <OfferLetterModal open={!!offerTarget} onClose={() => setOfferTarget(null)} candidate={offerTarget} />
        <WithdrawModal open={!!withdrawTarget} onClose={() => setWithdrawTarget(null)} candidate={withdrawTarget} />

        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Candidate"
          subtitle={`Remove ${deleteTarget?.candidate_name} from the system?`}
          footer={
            <>
              <button className="btn btn-sec" onClick={() => setDeleteTarget(null)}>Cancel</button>
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

        <Modal
          open={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          title="Delete Candidates"
          subtitle={`Remove ${selection.length} candidate${selection.length !== 1 ? 's' : ''}?`}
          footer={
            <>
              <button className="btn btn-sec" onClick={() => setBulkDeleteOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Removing…' : `Yes, Remove ${selection.length}`}
              </button>
            </>
          }
        >
          <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
            ⚠ Soft delete — records are preserved in audit logs.
          </div>
        </Modal>
      </AppShell>
    </PermissionGuard>
  );
}
