'use client';
/**
 * SectionTitle.tsx
 * Visual separator between form sections inside a wizard step.
 * ─ title: primary heading
 * ─ subtitle: secondary description / instruction
 * ─ action: optional right-side element (e.g. a "Same as present" toggle)
 * ─ variant: default (with border) | compact (tighter spacing) | card (shaded bg)
 */

import { ReactNode } from 'react';

type Variant = 'default' | 'compact' | 'card';

interface FieldPerm {
  can_view?: boolean;
}

interface Props {
  title:     string;
  subtitle?: string;
  action?:   ReactNode;
  variant?:  Variant;
  fields?: FieldPerm[];
}

const STYLES: Record<Variant, React.CSSProperties> = {
  default: {
    marginBottom:  16,
    paddingBottom: 10,
    borderBottom:  '1px solid var(--border)',
  },
  compact: {
    marginBottom:  10,
    paddingBottom: 6,
    borderBottom:  '1px solid var(--border)',
  },
  card: {
    marginBottom:  16,
    padding:       '8px 14px',
    background:    'var(--surface2)',
    borderRadius:  'var(--r)',
    border:        '1px solid var(--border)',
  },
};

export function SectionTitle({ title, subtitle, action, variant = 'default', fields }: Props) {
  if (
    fields &&
    fields.length > 0 &&
    !fields.some(field => field?.can_view !== false)
  ) {
    return null;
  }  
  return (
    <div style={{ ...STYLES[variant], display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
      <div>
        <h3 style={{
          fontSize:   variant === 'compact' ? 12 : 13,
          fontWeight: 600,
          color:      'var(--ink)',
          margin:     0,
          lineHeight: 1.4,
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            fontSize:  11,
            color:     'var(--ink4)',
            margin:    '2px 0 0',
            lineHeight: 1.4,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
}
