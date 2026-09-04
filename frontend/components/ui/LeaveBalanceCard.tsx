import { CSSProperties } from 'react';

interface LeaveBalance {
  leave_type_id: number;
  name: string;
  code: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
}

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  color?: string;
}

export function LeaveBalanceCard({
  balance,
  color = 'var(--blue)',
}: LeaveBalanceCardProps) {
  const allocated = Number(balance.allocated) || 0;
  const used = Number(balance.used) || 0;
  const pending = Number(balance.pending) || 0;
  const available = Number(balance.available) || 0;
  const carriedForward = Number(balance.carried_forward) || 0;

  const usedPercent =
    allocated > 0
      ? Math.min((used / allocated) * 100, 100)
      : 0;

  return (
    <div
      className="leave-balance-card"
      style={
        {
          '--leave-color': color,
        } as CSSProperties
      }
    >
      <div className="leave-balance-header">
        <div>
          <div className="leave-balance-code">
            {balance.code}
          </div>

          <div className="leave-balance-name">
            {balance.name}
          </div>
        </div>

        <div
          className="leave-balance-badge"
          style={{ color }}
        >
          {balance.code}
        </div>
      </div>

      <div className="leave-balance-main">
        <div
          className="leave-balance-available"
          style={{ color }}
        >
          {available}
        </div>

        <div className="leave-balance-label">
          days available
        </div>
      </div>

      <div className="leave-balance-progress">
        <div className="leave-balance-progress-info">
          <span>
            Used {used} of {allocated}
          </span>

          <span>
            {Math.round(usedPercent)}%
          </span>
        </div>

        <div className="leave-balance-progress-track">
          <div
            className="leave-balance-progress-fill"
            style={{
              width: `${usedPercent}%`,
              background: color,
            }}
          />
        </div>
      </div>

      <div className="leave-balance-stats">
        <div>
          <span>Used</span>
          <strong>{used}</strong>
        </div>

        <div>
          <span>Pending</span>
          <strong>{pending}</strong>
        </div>

        <div>
          <span>Carried</span>
          <strong>{carriedForward}</strong>
        </div>
      </div>
    </div>
  );
}