'use client';

export function Avatar({ name, size = 24, fontSize = 8 }: { name: string; size?: number; fontSize?: number }) {
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}
