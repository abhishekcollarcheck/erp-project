'use client';
import React from 'react';

export interface LeaveBalanceRow {
  leave_type_id: number;
  name: string;
  code: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  carried_forward: number;
  available: number;
}

export const ACCENTS = [
  { border: 'border-indigo-500', ring: 'ring-indigo-100', solid: 'bg-indigo-500', stroke: '#6366f1' },
  { border: 'border-teal-500', ring: 'ring-teal-100', solid: 'bg-teal-500', stroke: '#14b8a6' },
  { border: 'border-amber-500', ring: 'ring-amber-100', solid: 'bg-amber-500', stroke: '#f59e0b' },
  { border: 'border-pink-500', ring: 'ring-pink-100', solid: 'bg-pink-500', stroke: '#ec4899' },
  { border: 'border-violet-500', ring: 'ring-violet-100', solid: 'bg-violet-500', stroke: '#8b5cf6' },
  { border: 'border-cyan-500', ring: 'ring-cyan-100', solid: 'bg-cyan-500', stroke: '#06b6d4' },
] as const;

const RING_R = 25;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

export function balanceState(bal?: LeaveBalanceRow) {
  const hasBalance = !!bal;
  const allocated = bal?.allocated ?? 0;
  const used = bal?.used ?? 0;
  const pending = bal?.pending ?? 0;
  const available = bal?.available ?? 0;

  const usedUp = hasBalance && allocated > 0 && used >= allocated;
  const pendingBlocked = hasBalance && !usedUp && available <= 0 && pending > 0;
  const noAllocation = !hasBalance;
  const blocked = usedUp || pendingBlocked || noAllocation;
  const visualRemaining = Math.max(0, allocated - used);

  return { hasBalance, allocated, used, pending, available, usedUp, pendingBlocked, noAllocation, blocked, visualRemaining };
}

export function CheckBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full ${className}`}>
      <svg width={9} height={9} viewBox="0 0 12 12" fill="none">
        <path d="M2 6.2L4.8 9L10 3" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

interface LeaveBalanceCardProps {
  label: string;
  balance?: LeaveBalanceRow;
  accent: (typeof ACCENTS)[number];
  unit?: 'day' | 'minute';
  selected?: boolean;
  onSelect?: () => void;
  // false = plain read-only display (Balances tab); true = clickable picker (Apply modal)
  interactive?: boolean;
}

export function LeaveBalanceCard({
  label, balance, accent, unit = 'day', selected = false, onSelect, interactive = true,
}: LeaveBalanceCardProps) {
  const s = balanceState(balance);

  const ringColor = s.usedUp || s.noAllocation ? '#d1d5db' : accent.stroke;
  const ringRatio = s.allocated > 0 ? Math.min(1, s.visualRemaining / s.allocated) : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - ringRatio);

  const badge = s.noAllocation
    ? { text: 'No allocation', classes: 'bg-gray-100 text-gray-500' }
    : s.usedUp
      ? { text: 'Used up', classes: 'bg-red-50 text-red-600' }
      : s.pendingBlocked
        ? { text: 'Pending hold', classes: 'bg-amber-50 text-amber-600' }
        : null;

  const caption = s.noAllocation
    ? 'Not allocated this year'
    : s.usedUp
      ? 'No allowance left this year'
      : s.pendingBlocked
        ? `${s.pending} ${unit}(s) awaiting approval`
        : null;

  const formattedRemaining =
    s.visualRemaining > 999 ? `${(s.visualRemaining / 1000).toFixed(1)}k` : s.visualRemaining;

  const className = [
    'relative flex w-full flex-col items-center gap-1 rounded-2xl border bg-white px-4 pb-4 pt-5 text-center transition-all',
    selected ? `${accent.border} ring-4 ${accent.ring}` : 'border-gray-200',
    interactive && !s.blocked ? 'cursor-pointer hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5' : '',
    interactive && s.blocked ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ');

  const body = (
    <>
      {selected && <CheckBadge className={accent.solid} />}

      {badge && (
        <span className={`absolute left-2.5 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.classes}`}>
          {badge.text}
        </span>
      )}

      <div className="relative mt-0 flex shrink-0 items-center justify-center" style={{ width: '64px', height: '64px' }}>
        <svg width={64} height={64} viewBox="0 0 64 64" className="absolute inset-0 -rotate-90">
          <circle cx={32} cy={32} r={RING_R} fill="none" stroke="#eef0f3" strokeWidth={5} />
          <circle
            cx={32} cy={32} r={RING_R} fill="none" stroke={ringColor} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <span className="relative z-10 text-center text-base font-bold leading-none tracking-tight text-gray-900">
          {formattedRemaining}
        </span>
      </div>

      <span className="mt-1 w-full truncate text-[13px] font-semibold text-gray-800">{label}</span>
      <span className="text-[10.5px] text-gray-400">{s.hasBalance ? `of ${s.allocated} allocated` : 'not on record'}</span>

      {s.hasBalance && (s.used > 0 || s.pending > 0) && (
        <span className="text-[10px] text-gray-400">
          {s.used} used{s.pending ? ` · ${s.pending} pending` : ''}
        </span>
      )}

      {caption && (
        <span className={`mt-0.5 text-[10px] font-medium leading-snug ${s.usedUp ? 'text-red-600' : s.pendingBlocked ? 'text-amber-600' : 'text-gray-400'}`}>
          {caption}
        </span>
      )}
    </>
  );

  if (!interactive) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button type="button" onClick={onSelect} disabled={s.blocked} aria-pressed={selected} className={className}>
      {body}
    </button>
  );
}