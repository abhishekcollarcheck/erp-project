'use client';
import { useState } from 'react';

export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'last14' | 'lastMonth' | 'custom';

export interface DateRange {
  date_from: string; // YYYY-MM-DD
  date_to: string;   // YYYY-MM-DD
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 Days',
  last14: 'Last 14 Days',
  lastMonth: 'Last Month',
  custom: 'Custom',
};

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function computeRangeForPreset(preset: DateRangePreset): DateRange {
  const today = new Date();

  switch (preset) {
    case 'today':
      return { date_from: toISODate(today), date_to: toISODate(today) };

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { date_from: toISODate(y), date_to: toISODate(y) };
    }

    case 'last7': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6); // inclusive of today = 7 days total
      return { date_from: toISODate(from), date_to: toISODate(today) };
    }

    case 'last14': {
      const from = new Date(today);
      from.setDate(from.getDate() - 13);
      return { date_from: toISODate(from), date_to: toISODate(today) };
    }

    case 'lastMonth': {
      const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthEnd = new Date(firstOfThisMonth);
      lastMonthEnd.setDate(lastMonthEnd.getDate() - 1); // last day of previous month
      const lastMonthStart = new Date(lastMonthEnd.getFullYear(), lastMonthEnd.getMonth(), 1);
      return { date_from: toISODate(lastMonthStart), date_to: toISODate(lastMonthEnd) };
    }

    case 'custom':
      // Caller supplies the actual dates for custom — this default is a
      // reasonable fallback only, never shown once the user picks dates.
      return { date_from: toISODate(today), date_to: toISODate(today) };
  }
}

interface Props {
  value: DateRangePreset;
  range: DateRange;
  onChange: (preset: DateRangePreset, range: DateRange) => void;
}

export function DateRangePresetPicker({ value, range, onChange }: Props) {
  const [customFrom, setCustomFrom] = useState(range.date_from);
  const [customTo, setCustomTo] = useState(range.date_to);

  const selectPreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange('custom', { date_from: customFrom, date_to: customTo });
    } else {
      onChange(preset, computeRangeForPreset(preset));
    }
  };

  const applyCustom = () => {
    if (customFrom && customTo) onChange('custom', { date_from: customFrom, date_to: customTo });
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 2, gap: 2 }}>
        {(['today', 'yesterday', 'last7', 'last14', 'lastMonth', 'custom'] as const).map((p) => (
          <button
            key={p}
            onClick={() => selectPreset(p)}
            style={{
              padding: '4px 10px', border: 'none', borderRadius: 6,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: value === p ? 'var(--surface)' : 'transparent',
              color: value === p ? 'var(--ink)' : 'var(--ink4)',
              boxShadow: value === p ? 'var(--sh)' : 'none',
              fontFamily: 'var(--font)',
            }}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <span style={{ fontSize: 11, color: 'var(--ink4)' }}>to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          <button className="btn btn-sec btn-sm" onClick={applyCustom}>Apply</button>
        </div>
      )}
    </div>
  );
}