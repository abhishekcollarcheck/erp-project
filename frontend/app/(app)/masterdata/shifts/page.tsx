'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import {
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
} from '@/features/shift/hooks/useShift';
import { Shift } from '@/services/api/shift.service';

export default function ShiftsPage() {
  const [filterText, setFilterText] = useState('');

  // Form State
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('09:45');
  const [endTime, setEndTime] = useState('19:00');
  const [halfDayTime, setHalfDayTime] = useState('14:22');
  const [daySpan, setDaySpan] = useState<'1 day' | '2 days'>('1 day');

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editHalfDayTime, setEditHalfDayTime] = useState('');
  const [editDaySpan, setEditDaySpan] = useState<'1 day' | '2 days'>('1 day');

  // React Query Hooks
  const { data: shifts = [], isLoading } = useShifts();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const handleCreate = async () => {
    if (!label.trim()) return;

    await createShift.mutateAsync({
      label: label.trim(),
      start_time: startTime || null,
      end_time: endTime || null,
      half_day_time: halfDayTime || null,
      day_span: daySpan,
    });

    handleCancelForm();
  };

  const handleCancelForm = () => {
    setLabel('');
    setStartTime('09:45');
    setEndTime('19:00');
    setHalfDayTime('14:22');
    setDaySpan('1 day');
  };

  const startEdit = (shift: Shift) => {
    setEditingId(shift.id);
    setEditLabel(shift.label);
    setEditStartTime(shift.start_time || '');
    setEditEndTime(shift.end_time || '');
    setEditHalfDayTime(shift.half_day_time || '');
    setEditDaySpan(shift.day_span);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editLabel.trim()) return;

    await updateShift.mutateAsync({
      id,
      data: {
        label: editLabel.trim(),
        start_time: editStartTime || null,
        end_time: editEndTime || null,
        half_day_time: editHalfDayTime || null,
        day_span: editDaySpan,
      },
    });

    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this shift?')) {
      await deleteShift.mutateAsync(id);
    }
  };

  const formatTimeDisplay = (time: string | null) => {
    if (!time) return '-';
    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter((s) =>
      s.label.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [shifts, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="pg-enter">
          <div className="ph">
            <div>
              <h1>Shifts</h1>
              <p>Name, start, end &amp; half-day in one place · Syncs to employee forms</p>
            </div>
          </div>

          {/* New Shift Creation */}
          <div className="card cp mb14">
            <div className="ct">New shift</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}>
              <div className="fg" style={{ minWidth: 220, flex: 1 }}>
                <label>Shift Name / Marking</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Shift (9.45 A - 7.0 P)"
                />
              </div>

              <div className="fg" style={{ width: 120 }}>
                <label>Start</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>

              <div className="fg" style={{ width: 120 }}>
                <label>End</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>

              <div className="fg" style={{ width: 130 }}>
                <label>Half-Day Mark</label>
                <input type="time" value={halfDayTime} onChange={(e) => setHalfDayTime(e.target.value)} />
              </div>

              <div className="fg" style={{ width: 110 }}>
                <label>Day Span</label>
                <select value={daySpan} onChange={(e) => setDaySpan(e.target.value as '1 day' | '2 days')}>
                  <option value="1 day">1 day</option>
                  <option value="2 days">2 days</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button type="button" className="btn btn-sec btn-sm" onClick={handleCancelForm}>
                  Cancel
                </button>
                <button type="button" className="btn btn-pri btn-sm" disabled={createShift.isPending || !label.trim()} onClick={handleCreate}>
                  <Plus size={14} />
                  Save Shift
                </button>
              </div>
            </div>
          </div>

          <div className="card cp">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
              <div className="search-bar" style={{ maxWidth: 240 }}>
                <span style={{ color: 'var(--ink4)' }}>⌕</span>
                <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter shifts..." />
              </div>
              <Chip variant="gray">{filteredShifts.length}</Chip>
            </div>

            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Shift</th>
                    <th style={{ textAlign: 'center' }}>Start</th>
                    <th style={{ textAlign: 'center' }}>End</th>
                    <th style={{ textAlign: 'center' }}>Half</th>
                    <th style={{ textAlign: 'center' }}>Span</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--ink4)' }}>Loading shifts...</td></tr>
                  ) : filteredShifts.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--ink4)' }}>No shifts found.</td></tr>
                  ) : (
                    filteredShifts.map((shift) => {
                      const isEditing = editingId === shift.id;
                      return (
                        <tr key={shift.id}>
                          <td>
                            {isEditing ? (
                              <div className="fg" style={{ margin: 0 }}>
                                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                              </div>
                            ) : (
                              <strong>{shift.label}</strong>
                            )}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div className="fg" style={{ margin: 0 }}>
                                <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                              </div>
                            ) : (
                              <Chip variant="blue">{formatTimeDisplay(shift.start_time)}</Chip>
                            )}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div className="fg" style={{ margin: 0 }}>
                                <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                              </div>
                            ) : (
                              <Chip variant="blue">{formatTimeDisplay(shift.end_time)}</Chip>
                            )}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div className="fg" style={{ margin: 0 }}>
                                <input type="time" value={editHalfDayTime} onChange={(e) => setEditHalfDayTime(e.target.value)} />
                              </div>
                            ) : (
                              <Chip variant="blue">{formatTimeDisplay(shift.half_day_time)}</Chip>
                            )}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            {isEditing ? (
                              <div className="fg" style={{ margin: 0 }}>
                                <select value={editDaySpan} onChange={(e) => setEditDaySpan(e.target.value as '1 day' | '2 days')}>
                                  <option value="1 day">1 day</option>
                                  <option value="2 days">2 days</option>
                                </select>
                              </div>
                            ) : (
                              shift.day_span
                            )}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              {isEditing ? (
                                <>
                                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => handleSaveEdit(shift.id)}>
                                    <Check size={14} /> Save
                                  </button>
                                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancelEdit}>
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button type="button" className="btn btn-ghost btn-sm" title="Edit Shift" onClick={() => startEdit(shift)}>
                                    <Pencil size={13} />
                                  </button>
                                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} title="Delete Shift" onClick={() => handleDelete(shift.id)}>
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </MasterDataLayout>
    </AppShell>
  );
}
