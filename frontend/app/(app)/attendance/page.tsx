'use client';
import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { useAppDispatch } from '../../../store';
import { setPageTitle } from '../../../store/slices/uiSlice';
import { AppShell } from '../../../layouts/AppLayout';
import { StatCard } from '../../../components/ui/StatCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

function unwrap<T>(json: any): T {
  if (json && typeof json === 'object' && json.success === false) throw new Error(json.message || 'Request failed');
  if (json && typeof json === 'object' && 'data' in json) return json.data as T;
  return json as T;
}
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error((json && json.message) || `${res.status} ${res.statusText}`);
  return unwrap<T>(json);
}
async function apiSend<T>(path: string, method: 'POST' | 'PUT', body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method, headers: authHeaders(), body: JSON.stringify(body) });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error((json && json.message) || `${res.status} ${res.statusText}`);
  return unwrap<T>(json);
}

type AttendanceStatus = 'Present' | 'Absent' | 'WFH' | 'Half-Day' | 'Holiday' | 'Leave';

interface AttendanceRow {
  id: number;
  employee_id: number;
  date: string;
  status: AttendanceStatus;
  source: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  Employee?: { id: number; first_name: string; last_name: string; employee_code: string };
}
interface PaginatedResponse<T> { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } }
interface RegularizationRequest {
  id: number; employee_id: number; date: string;
  requested_check_in: string | null; requested_check_out: string | null;
  reason: string; status: 'Pending' | 'Approved' | 'Rejected'; created_at: string;
  Employee?: { first_name: string; last_name: string; employee_code: string };
}

const STATUS_CODE: Record<AttendanceStatus, string> = { Present: 'P', Absent: 'A', WFH: 'W', 'Half-Day': 'P', Holiday: 'H', Leave: 'L' };
const DAY_STYLE: Record<string, string> = { P: 'ag-p', A: 'ag-a', W: 'ag-w', L: 'ag-l', H: 'ag-h', '—': 'ag-off' };
const REG_STYLE: Record<string, string> = { Pending: 'ag-w', Approved: 'ag-p', Rejected: 'ag-a' };
const inputStyle = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 };

export default function AttendancePage() {
  const dispatch = useAppDispatch();
  useEffect(() => { dispatch(setPageTitle({ title: 'Attendance & Time', breadcrumb: 'Operations' })); }, [dispatch]);

  // ═══ STEP 1: filterable attendance list ═════════════════════════════════
  const now = new Date();
  const [filters, setFilters] = useState({
    search: '', status: '', source: '',
    date_from: '', date_to: '',
    month: String(now.getMonth() + 1), year: String(now.getFullYear()),
    useRange: false, // toggle between date_from/date_to and month/year
  });
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<AttendanceRow>['meta'] | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (filters.search) qs.set('search', filters.search);
      if (filters.status) qs.set('status', filters.status);
      if (filters.source) qs.set('source', filters.source);
      if (filters.useRange) {
        if (filters.date_from) qs.set('date_from', filters.date_from);
        if (filters.date_to) qs.set('date_to', filters.date_to);
      } else {
        qs.set('month', filters.month);
        qs.set('year', filters.year);
      }
      const result = await apiGet<PaginatedResponse<AttendanceRow>>(`/attendance?${qs.toString()}`);
      setRows(result.data ?? []);
      setMeta(result.meta ?? null);
    } catch (e: any) {
      setListError(e.message || 'Failed to load attendance');
    } finally {
      setListLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { loadList(); }, [loadList]);

  function updateFilter(key: string, value: string | boolean) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  // ═══ STEP 2: regularization — submit + my requests + approval queue ═════
  const [showRegForm, setShowRegForm] = useState(false);
  const [regDate, setRegDate] = useState(now.toISOString().split('T')[0]);
  const [regCheckIn, setRegCheckIn] = useState('');
  const [regCheckOut, setRegCheckOut] = useState('');
  const [regReason, setRegReason] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<RegularizationRequest[] | null>(null);
  const [pending, setPending] = useState<RegularizationRequest[] | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadMyRequests = useCallback(async () => {
    try { setMyRequests(await apiGet<RegularizationRequest[]>('/attendance/regularization/my')); }
    catch { setMyRequests([]); }
  }, []);
  const loadPending = useCallback(async () => {
    try { setPending(await apiGet<RegularizationRequest[]>('/attendance/regularization/pending')); }
    catch { setPending(null); } // hides the panel for non-manager roles
  }, []);
  useEffect(() => { loadMyRequests(); loadPending(); }, [loadMyRequests, loadPending]);

  async function submitRegularization(e: FormEvent) {
    e.preventDefault();
    if (!regCheckIn && !regCheckOut) { setRegError('Provide a corrected check-in or check-out time'); return; }
    if (!regReason.trim()) { setRegError('Please give a reason'); return; }
    setRegSubmitting(true); setRegError(null);
    try {
      await apiSend('/attendance/regularization', 'POST', {
        date: regDate, requested_check_in: regCheckIn || null, requested_check_out: regCheckOut || null, reason: regReason.trim(),
      });
      setShowRegForm(false); setRegCheckIn(''); setRegCheckOut(''); setRegReason('');
      await loadMyRequests();
    } catch (e: any) { setRegError(e.message || 'Failed to submit'); }
    finally { setRegSubmitting(false); }
  }

  async function review(id: number, decision: 'Approved' | 'Rejected') {
    setReviewingId(id);
    try {
      await apiSend(`/attendance/regularization/${id}/review`, 'PUT', { decision });
      await Promise.all([loadPending(), loadList()]);
    } catch (e: any) { alert(e.message || 'Failed to review'); }
    finally { setReviewingId(null); }
  }

  return (
    <AppShell>
      <div className="pg-enter">
        <div className="ph">
          <div>
            <h1>Attendance &amp; Time</h1>
            <p>Filterable records · Regularization requests</p>
          </div>
          <div className="ph-r">
            <button className="btn btn-pri btn-sm" onClick={() => setShowRegForm(true)}>+ Request Correction</button>
          </div>
        </div>

        {/* ── STEP 2: My Attendance — regularization ─────────────────────── */}
        <div className="card cp mb14">
          <div className="ct">My Attendance — Regularization Requests</div>

          {showRegForm && (
            <form onSubmit={submitRegularization} style={{ marginBottom: 14, padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <input type="date" value={regDate} onChange={(e) => setRegDate(e.target.value)} style={inputStyle} />
                <input type="time" value={regCheckIn} onChange={(e) => setRegCheckIn(e.target.value)} style={inputStyle} placeholder="Corrected check-in" />
                <input type="time" value={regCheckOut} onChange={(e) => setRegCheckOut(e.target.value)} style={inputStyle} placeholder="Corrected check-out" />
              </div>
              <textarea
                placeholder="Reason (e.g. forgot to punch out)"
                value={regReason}
                onChange={(e) => setRegReason(e.target.value)}
                style={{ ...inputStyle, width: '100%', minHeight: 60, marginBottom: 8, fontFamily: 'inherit' }}
              />
              {regError && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{regError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-pri btn-sm" disabled={regSubmitting}>{regSubmitting ? 'Submitting…' : 'Submit Request'}</button>
                <button type="button" className="btn btn-sec btn-sm" onClick={() => setShowRegForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {myRequests === null ? (
            <div style={{ fontSize: 12 }}>Loading your requests…</div>
          ) : myRequests.length > 0 ? (
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
                      <td><span className={`ag-cell ${REG_STYLE[r.status]}`} style={{ width: 'auto', padding: '2px 8px', display: 'inline-flex', fontSize: 10 }}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted, #888)' }}>No correction requests yet.</div>
          )}
        </div>

        {pending !== null && (
          <div className="card cp mb14">
            <div className="ct">Pending Regularization Approvals ({pending.length})</div>
            {pending.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted, #888)' }}>Nothing pending review.</div>
            ) : (
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
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-pri btn-sm" disabled={reviewingId === r.id} onClick={() => review(r.id, 'Approved')}>Approve</button>
                          <button className="btn btn-sec btn-sm" disabled={reviewingId === r.id} onClick={() => review(r.id, 'Rejected')}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Filterable attendance list ───────────────────────────── */}
        <div className="card">
          <div style={{ padding: '13px 17px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Attendance Records</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="Search name or code…" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} style={{ ...inputStyle, width: 180 }} />
              <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} style={inputStyle}>
                <option value="">All Statuses</option>
                {['Present', 'Absent', 'WFH', 'Half-Day', 'Holiday', 'Leave'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.source} onChange={(e) => updateFilter('source', e.target.value)} style={inputStyle}>
                <option value="">All Sources</option>
                {['Biometric', 'Manual', 'Mobile', 'System'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label style={{ fontSize: 12, display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="checkbox" checked={filters.useRange} onChange={(e) => updateFilter('useRange', e.target.checked)} />
                Use date range
              </label>
              {filters.useRange ? (
                <>
                  <input type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} style={inputStyle} />
                  <input type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} style={inputStyle} />
                </>
              ) : (
                <>
                  <select value={filters.month} onChange={(e) => updateFilter('month', e.target.value)} style={inputStyle}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'long' })}</option>
                    ))}
                  </select>
                  <input type="number" value={filters.year} onChange={(e) => updateFilter('year', e.target.value)} style={{ ...inputStyle, width: 90 }} />
                </>
              )}
            </div>
          </div>

          {listError && (
            <div style={{ padding: 12, color: 'var(--red)', fontSize: 12 }}>
              {listError} <button className="btn btn-sec btn-sm" onClick={loadList}>Retry</button>
            </div>
          )}

          <div className="tw">
            <table>
              <thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Source</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr></thead>
              <tbody>
                {listLoading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Loading…</td></tr>}
                {!listLoading && rows.length === 0 && !listError && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No records match these filters.</td></tr>}
                {!listLoading && rows.map((row) => {
                  const code = STATUS_CODE[row.status] || '—';
                  return (
                    <tr key={row.id}>
                      <td><strong>{row.Employee ? `${row.Employee.first_name} ${row.Employee.last_name}` : `#${row.employee_id}`}</strong></td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.date}</td>
                      <td><span className={`ag-cell ${DAY_STYLE[code]}`} style={{ width: 24, height: 24, display: 'inline-flex', fontSize: 10 }}>{code}</span></td>
                      <td style={{ fontSize: 11 }}>{row.source}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.check_in ?? '—'}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.check_out ?? '—'}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{row.working_hours ?? '—'}</td>
                    </tr>
                  );
                })}
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
    </AppShell>
  );
}