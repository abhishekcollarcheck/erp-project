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

  console.log("fields", fields)
  const canView = fields.some(f => f?.can_view);
  console.log("canView", canView)
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