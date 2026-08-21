'use client';
import type { PermGroup } from '../types/permissions.types';
import { cssForKey } from '../utils/rolePermissionsUtils';

export function GroupSidebar({
  groups, selectedId, onSelect, onNew, membersMap, compact = false,
}: {
  groups: PermGroup[];
  selectedId: number | null;
  onSelect: (g: PermGroup) => void;
  onNew?: () => void;
  membersMap: Record<number, any[]>;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {groups.map(g => {
          const isActive = g.id === selectedId;
          return (
            <div
              key={g.id}
              onClick={() => onSelect(g)}
              title={g.name}
              style={{
                cursor: 'pointer', background: isActive ? 'var(--blue-lt)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                borderRadius: 'var(--r2)', padding: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cssForKey(g.color), flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {groups.map(g => {
        const isActive = g.id === selectedId;
        const count = membersMap[g.id]?.length ?? g.member_count;
        return (
          <div
            key={g.id}
            onClick={() => onSelect(g)}
            style={{
              cursor: 'pointer', background: isActive ? 'var(--blue-lt)' : 'var(--surface)',
              border: `1px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 'var(--r2)', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 10, transition: 'all .1s',
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: cssForKey(g.color), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 1 }}>{count} member{count !== 1 ? 's' : ''}</div>
            </div>
            {isActive && <span style={{ color: 'var(--blue)', fontSize: 13 }}>❯</span>}
          </div>
        );
      })}
      {onNew && (
        <button className="btn btn-sec btn-sm" style={{ width: '100%', marginTop: 4 }} onClick={onNew}>
          + New Group
        </button>
      )}
    </div>
  );
}