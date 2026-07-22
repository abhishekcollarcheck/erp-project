'use client';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';
import { Chip } from '../../../components/ui/Chip';
import { RegularizationFormModal } from '../../../features/attendance/components/RegularizationForm';
import { ReviewRegularizationModal } from '../../../features/attendance/components/ReviewRegularization';
import { DateRangePresetPicker, computeRangeForPreset, type DateRangePreset, type DateRange } from '../../../features/attendance/components/DaterangePresetPicker';
import {
  useTodaySummary,
  useAttendanceList,
  useMyRegularizations,
  usePendingRegularizations,
  useMyBiometricAttendance,
  useMyCombinedAttendance,
} from '../../../features/attendance/hooks/useAttendance';
import { usePermission } from '../../../features/auth/hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import type { AttendanceStatus, AttendanceSource, RegularizationRequest } from '../../../services/api/attendance.service';
import { PermissionGuard } from '../../../utils/permissionGuard';

const STATUS_VARIANT: Record<AttendanceStatus, 'green' | 'red' | 'blue' | 'amber' | 'gray'> = {
  Present: 'green', Absent: 'red', WFH: 'blue', 'Half-Day': 'amber', Holiday: 'gray', Leave: 'amber',
};
const REG_STATUS_VARIANT: Record<string, 'green' | 'red' | 'amber'> = {
  Approved: 'green', Rejected: 'red', Pending: 'amber',
};

export default function AttendancePage() {
  const dispatch = useAppDispatch();
  const { canCreate } = usePermission();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AttendanceStatus | ''>('');
  const [source, setSource] = useState<AttendanceSource | ''>('');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);

  const [regFormOpen, setRegFormOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<RegularizationRequest | null>(null);

  const [bioPreset, setBioPreset] = useState<DateRangePreset>('today');
  const [bioRange, setBioRange] = useState<DateRange>(() => computeRangeForPreset('today'));

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    dispatch(setPageTitle({ title: 'Attendance & Time', breadcrumb: 'Operations' }));
  }, [dispatch]);

  const { data: summary } = useTodaySummary();
  const { data: list, isLoading } = useAttendanceList({
    search: debouncedSearch || undefined,
    status: status || undefined,
    source: source || undefined,
    month,
    year,
    page,
    limit: 20,
  });
  const records = list?.data ?? [];
  const meta = list?.meta;

  const { data: myRequests = [] } = useMyRegularizations();
  const { data: pending } = usePendingRegularizations(); // undefined/[] if not a manager — hook has retry:false
  const { data: myBiometric } = useMyBiometricAttendance({ date_from: bioRange.date_from, date_to: bioRange.date_to });
  const { data: myCombined, isLoading: combinedLoading, error: combinedError } = useMyCombinedAttendance({
    date_from: bioRange.date_from,
    date_to: bioRange.date_to,
  });

  const avgAttendancePct = summary && summary.total > 0
    ? (((summary.present + summary.wfh) / summary.total) * 100).toFixed(1) + '%'
    : '…';

  return (
    // <PermissionGuard permission="attendance:view">
      <AppShell onAddNew={canCreate('attendance') ? () => setRegFormOpen(true) : undefined}>
        <div className="pg-enter">

          {/* Header */}
          <div className="ph">
            <div>
              <h1>Attendance &amp; Time</h1>
              <p>Filterable records · Regularization requests · Biometric integration</p>
            </div>
            <div className="ph-r">
              <button className="btn btn-pri btn-sm" onClick={() => setRegFormOpen(true)}>+ Request Correction</button>
            </div>
          </div>

          {/* Stats */}
          <div className="g4 mb14">
            <StatCard label="Present Today" value={summary?.present ?? '…'} color="var(--green)" />
            <StatCard label="Absent" value={summary?.absent ?? '…'} color="var(--red)" />
            <StatCard label="WFH" value={summary?.wfh ?? '…'} color="var(--blue)" />
            <StatCard label="Avg Attendance %" value={avgAttendancePct} color="var(--teal)" />
          </div>

          {/* My Attendance — regularization history */}
          <div className="card cp mb14">
            <div className="ct">My Attendance — Regularization Requests</div>
            {myRequests.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink4)' }}>No correction requests yet.</div>
            ) : (
              <div className="tw">
                <table>
                  <thead><tr><th>Date</th><th>Requested In</th><th>Requested Out</th><th>Reason</th><th>Status</th></tr></thead>
                  <tbody>
                    {myRequests.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.date}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.requested_check_in ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.requested_check_out ?? '—'}</td>
                        <td style={{ fontSize: 12 }}>{r.reason}</td>
                        <td><Chip variant={REG_STATUS_VARIANT[r.status]}>{r.status}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending approvals — only rendered if the API actually returned something (manager/HR) */}
          {pending && pending.length > 0 && (
            <div className="card cp mb14">
              <div className="ct">Pending Regularization Approvals ({pending.length})</div>
              <div className="tw">
                <table>
                  <thead><tr><th>Employee</th><th>Date</th><th>Requested In</th><th>Requested Out</th><th>Reason</th><th>Action</th></tr></thead>
                  <tbody>
                    {pending.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.Employee ? `${r.Employee.first_name} ${r.Employee.last_name}` : `#${r.employee_id}`}</strong></td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.date}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.requested_check_in ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.requested_check_out ?? '—'}</td>
                        <td style={{ fontSize: 12 }}>{r.reason}</td>
                        <td><Chip variant="blue" onClick={() => setReviewTarget(r)}>Review</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* My Attendance — Combined (Biometric + Trakola) */}
          <div className="card cp mb14">
            <div className="ct">My Attendance — Combined (Biometric + Trakola)</div>
            <div style={{ marginBottom: 12 }}>
              <DateRangePresetPicker
                value={bioPreset}
                range={bioRange}
                onChange={(preset, range) => { setBioPreset(preset); setBioRange(range); }}
              />
            </div>

            {combinedError && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10 }}>
                Failed to load combined attendance: {(combinedError as any)?.message || 'Unknown error'}
              </div>
            )}

            {combinedLoading ? (
              <div style={{ fontSize: 12, padding: 20, textAlign: 'center' }}>Loading…</div>
            ) : !myCombined || myCombined.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink4)' }}>No punches found for this period.</div>
            ) : (
              <div className="tw">
                <table>
                  <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Sources</th></tr></thead>
                  <tbody>
                    {myCombined.map((r) => (
                      <tr key={r.date}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.date}</td>
                        <td><Chip variant={r.status === 'Present' ? 'green' : r.status === 'Incomplete' ? 'amber' : 'gray'}>{r.status}</Chip></td>
                        {/* Missing punch → dash, never a guessed value */}
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.check_in ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.check_out ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.working_hours ?? '—'}</td>
                        <td style={{ display: 'flex', gap: 4 }}>
                          {r.sources.map((s) => (
                            <Chip key={s} variant={s === 'Biometric' ? 'blue' : 'amber'}>{s}</Chip>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My Biometric Attendance (kept separate — biometric-only view for comparison/debugging) */}
          <div className="card cp mb14">
            <div className="ct">My Biometric Attendance (Biometric-only)</div>
            {!myBiometric || myBiometric.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--ink4)' }}>No punches found for this period.</div>
            ) : (
              <div className="tw">
                <table>
                  <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Punches</th></tr></thead>
                  <tbody>
                    {myBiometric.map((r) => (
                      <tr key={r.date}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.date}</td>
                        <td><Chip variant={r.status === 'Present' ? 'green' : r.status === 'Incomplete' ? 'amber' : 'gray'}>{r.status}</Chip></td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.check_in ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.check_out ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.working_hours ?? '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{r.punch_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filterable attendance records */}
          <div className="card">
            <div style={{ padding: '13px 17px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Attendance Records</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar" style={{ maxWidth: 220 }}>
                  <span style={{ color: 'var(--ink4)' }}>⌕</span>
                  <input
                    type="text"
                    placeholder="Search name or code…"
                    value={search}
                    onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  />
                </div>
                <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as AttendanceStatus | ''); }}>
                  <option value="">All Statuses</option>
                  {(['Present', 'Absent', 'WFH', 'Half-Day', 'Holiday', 'Leave'] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select value={source} onChange={(e) => { setPage(1); setSource(e.target.value as AttendanceSource | ''); }}>
                  <option value="">All Sources</option>
                  {(['Biometric', 'Manual', 'Mobile', 'System'] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select value={month} onChange={(e) => { setPage(1); setMonth(Number(e.target.value)); }}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'long' })}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => { setPage(1); setYear(Number(e.target.value)); }}
                  style={{ width: 90 }}
                />
              </div>
            </div>

            <div className="tw">
              <table>
                <thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Source</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr></thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j}><div className="skeleton" style={{ height: 14, width: 80 }} /></td>
                        ))}
                      </tr>
                    ))
                    : records.length === 0
                      ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--ink4)' }}>No records match these filters.</td></tr>
                      : records.map((row) => (
                        <tr key={row.id}>
                          <td><strong>{row.Employee ? `${row.Employee.first_name} ${row.Employee.last_name}` : `#${row.employee_id}`}</strong></td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.date}</td>
                          <td><Chip variant={STATUS_VARIANT[row.status]}>{row.status}</Chip></td>
                          <td style={{ fontSize: 11 }}>{row.source}</td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.check_in ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.check_out ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.working_hours ?? '—'}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: 12 }}>
                <button className="btn btn-sec btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                <span style={{ fontSize: 12, alignSelf: 'center' }}>Page {meta.page} of {meta.totalPages}</span>
                <button className="btn btn-sec btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
              </div>
            )}
          </div>
        </div>

        <RegularizationFormModal open={regFormOpen} onClose={() => setRegFormOpen(false)} />
        <ReviewRegularizationModal request={reviewTarget} onClose={() => setReviewTarget(null)} />
      </AppShell>
    // </PermissionGuard>
  );
}