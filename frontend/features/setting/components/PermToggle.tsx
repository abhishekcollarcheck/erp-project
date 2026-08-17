'use client';

export function PermToggle({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 26, height: 26, borderRadius: 6,
        border: `1px solid ${on ? 'var(--blue)' : 'var(--border2)'}`,
        background: on ? 'var(--blue-lt)' : 'var(--surface2)',
        color: on ? 'var(--blue)' : 'var(--ink4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all .1s', margin: '0 auto', userSelect: 'none',
      }}
    >
      {on ? '✓' : ''}
    </div>
  );
}
