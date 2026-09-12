import { ReactNode } from 'react';

interface FieldPerm {
  can_view?: boolean;
}

interface Props {
  fields: (FieldPerm | undefined)[];
  children: ReactNode;
  noAccessMessage?: string;
}

export function FormSection({
  fields,
  children,
  noAccessMessage = "You don't have access to view this section.",
}: Props) {

  // Visible when at least one field in the step is viewable. An empty list means
  // "membership unknown / not permission-configured" — show it (per-field gates
  // still apply); only an explicit all-hidden set collapses the whole step.
  const canView = fields.length === 0 || fields.some(f => f?.can_view);
  return (
    <>
      {canView ? (
        children
      ) : (
        <div
          style={{
            padding: 16,
            color: 'var(--ink4)',
            fontSize: 12,
            fontStyle: 'italic',
            border: '1px dashed var(--border)',
            borderRadius: 8,
            background: 'var(--surface2)',
          }}
        >
          {noAccessMessage}
        </div>
      )}
    </>
  );
}