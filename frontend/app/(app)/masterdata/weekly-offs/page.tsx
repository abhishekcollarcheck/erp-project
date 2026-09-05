'use client';

import React, { useState, useMemo } from 'react';
import { MasterDataLayout } from '@/components/layout/MasterDataLayout';
import { AppShell } from '@/layouts/AppLayout';
import { Pencil, X, Plus } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import {
  useWeeklyOffs,
  useCreateWeeklyOff,
  useUpdateWeeklyOff,
  useDeleteWeeklyOff,
} from '@/features/weeklyoff/hooks/useWeeklyoff';
import { WeekDay, NthRule, WeeklyOffPreset } from '@/services/api/weeklyOffService';

const DAYS: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES: Record<WeekDay, string> = {
  Sun: 'Sunday',
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
};

// Safe JSON/Array Parser Guard
const parseArrayData = <T,>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function WeeklyOffsPage() {
  const [filterText, setFilterText] = useState('');

  // Form & Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [alwaysOff, setAlwaysOff] = useState<WeekDay[]>([]);
  const [nthRules, setNthRules] = useState<NthRule[]>([]);

  // React Query Hooks
  const { data: rawPresets = [], isLoading } = useWeeklyOffs();
  const createPreset = useCreateWeeklyOff();
  const updatePreset = useUpdateWeeklyOff();
  const deletePreset = useDeleteWeeklyOff();

  const handleToggleAlwaysOff = (day: WeekDay) => {
    setAlwaysOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddNthRule = () => {
    setNthRules((prev) => [...prev, { weeks: [], day: 'Sat' }]);
  };

  const handleRemoveNthRule = (index: number) => {
    setNthRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateNthRuleDay = (index: number, day: WeekDay) => {
    setNthRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], day };
      return updated;
    });
  };

  const handleToggleNthRuleWeek = (ruleIndex: number, weekNum: number) => {
    setNthRules((prev) => {
      const updated = [...prev];
      const targetWeeks = parseArrayData<number>(updated[ruleIndex]?.weeks);
      const newWeeks = targetWeeks.includes(weekNum)
        ? targetWeeks.filter((w) => w !== weekNum)
        : [...targetWeeks, weekNum].sort((a, b) => a - b);

      updated[ruleIndex] = { ...updated[ruleIndex], weeks: newWeeks };
      return updated;
    });
  };

  const handleStartEdit = (preset: WeeklyOffPreset) => {
    setEditingId(preset.id);
    setName(preset.name);
    setAlwaysOff(parseArrayData<WeekDay>(preset.always_off));
    setNthRules(parseArrayData<NthRule>(preset.nth_off_rules));
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setAlwaysOff([]);
    setNthRules([]);
  };

  const handleSavePreset = async () => {
    if (!name.trim()) return;

    if (editingId) {
      await updatePreset.mutateAsync({
        id: editingId,
        data: {
          name: name.trim(),
          always_off: alwaysOff,
          nth_off_rules: nthRules,
        },
      });
    } else {
      await createPreset.mutateAsync({
        name: name.trim(),
        always_off: alwaysOff,
        nth_off_rules: nthRules,
      });
    }

    handleResetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      await deletePreset.mutateAsync(id);
    }
  };

  const formatAlwaysOff = (days: any) => {
    const safeDays = parseArrayData<WeekDay>(days);
    if (safeDays.length === 0) return '-';
    return safeDays.map((d) => FULL_DAY_NAMES[d] || d).join(', ');
  };

  const formatNthRules = (rules: any) => {
    const safeRules = parseArrayData<NthRule>(rules);
    if (safeRules.length === 0) return '-';

    return safeRules
      .map((r) => {
        const safeWeeks = parseArrayData<number>(r.weeks);
        if (safeWeeks.length === 0) return `Any ${r.day}`;
        if (safeWeeks.length === 5) return `All ${r.day}`;

        const ordinalString = safeWeeks
          .map((w) => {
            if (w === 1) return '1st';
            if (w === 2) return '2nd';
            if (w === 3) return '3rd';
            return `${w}th`;
          })
          .join(' & ');
        return `${ordinalString} ${r.day}`;
      })
      .join(', ');
  };

  const filteredPresets = useMemo(() => {
    const safePresets = parseArrayData<WeeklyOffPreset>(rawPresets);
    return safePresets.filter((p) =>
      p.name.toLowerCase().includes(filterText.toLowerCase().trim())
    );
  }, [rawPresets, filterText]);

  return (
    <AppShell>
      <MasterDataLayout>
        <div className="pg-enter">
          <div className="ph">
            <div>
              <h1>Weekly Offs</h1>
              <p>Presets for any weekday combo + nth Saturday · Site defaults on Locations → Site</p>
            </div>
          </div>

          {/* New / Edit Preset Form */}
          <div className="card cp mb14">
            <div className="ct">{editingId ? 'Edit weekly off preset' : 'New weekly off preset'}</div>

            <div className="fg">
              <label>Preset Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunday + 4th Saturday"
              />
            </div>

            <div className="fg">
              <label>Weekdays always off (every week)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map((day) => {
                  const isChecked = alwaysOff.includes(day);
                  return (
                    <label
                      key={day}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 11px',
                        borderRadius: 'var(--r)', fontSize: 12, cursor: 'pointer', userSelect: 'none',
                        border: `1px solid ${isChecked ? 'var(--blue)' : 'var(--border2)'}`,
                        background: isChecked ? 'var(--blue-lt)' : 'var(--surface)',
                        color: isChecked ? 'var(--blue)' : 'var(--ink3)',
                        fontWeight: isChecked ? 600 : 500,
                      }}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => handleToggleAlwaysOff(day)} style={{ margin: 0 }} />
                      {day}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="fg">
              <label>
                Nth-of-month offs{' '}
                <span style={{ fontWeight: 400, fontStyle: 'italic', textTransform: 'none', color: 'var(--ink4)' }}>
                  (any weekday — e.g. 2nd &amp; 4th Sunday)
                </span>
              </label>

              {nthRules.map((rule, idx) => {
                const safeWeeks = parseArrayData<number>(rule.weeks);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderRadius: 'var(--r)', padding: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((w) => {
                        const isSelected = safeWeeks.includes(w);
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => handleToggleNthRuleWeek(idx, w)}
                            className={isSelected ? 'btn btn-pri btn-sm' : 'btn btn-sec btn-sm'}
                            style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>

                    <div className="fg" style={{ margin: 0 }}>
                      <select value={rule.day} onChange={(e) => handleUpdateNthRuleDay(idx, e.target.value as WeekDay)}>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleRemoveNthRule(idx)}>
                      <X size={14} />
                    </button>
                  </div>
                );
              })}

              <button type="button" className="btn btn-sec btn-sm" onClick={handleAddNthRule}>
                <Plus size={12} /> Add nth rule
              </button>
            </div>

            <div className="modal-ft">
              {editingId && (
                <button type="button" className="btn btn-sec btn-sm" onClick={handleResetForm}>Cancel</button>
              )}
              <button type="button" className="btn btn-pri btn-sm" onClick={handleSavePreset}>
                {editingId ? 'Update Preset' : 'Save Preset'}
              </button>
            </div>
          </div>

          <div className="card cp">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
              <div className="search-bar" style={{ maxWidth: 220 }}>
                <span style={{ color: 'var(--ink4)' }}>⌕</span>
                <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter presets..." />
              </div>
              <Chip variant="gray">{filteredPresets.length}</Chip>
            </div>

            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Preset</th>
                    <th>Always Off</th>
                    <th>Nth-of-Month</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--ink4)' }}>Loading presets...</td></tr>
                  ) : filteredPresets.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--ink4)' }}>No presets found.</td></tr>
                  ) : (
                    filteredPresets.map((preset) => (
                      <tr key={preset.id}>
                        <td><strong>{preset.name}</strong></td>
                        <td>{formatAlwaysOff(preset.always_off)}</td>
                        <td>{formatNthRules(preset.nth_off_rules)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleStartEdit(preset)}>
                              <Pencil size={13} />
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(preset.id)}>
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
