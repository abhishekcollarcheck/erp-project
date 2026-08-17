'use client';
import { Eye, SquarePen, Trash2, Download, Pen } from 'lucide-react';

// Only module-level permissions (field-level is separate)
export const PERMS = ['view', 'create', 'edit', 'delete', 'download'] as const;

export const PERM_ICONS: Record<string, React.ReactNode> = {
  view: <Eye size={13} />,
  create: <Pen size={13} />,
  edit: <SquarePen size={13} />,
  delete: <Trash2 size={13} />,
  download: <Download size={13} />,
};
export const PERM_LABELS: Record<string, string> = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', download: 'Download',
};

export type ModulePerms = Record<string, Record<string, boolean>>;

export const COLOR_OPTS = [
  { key: 'blue', css: 'var(--blue)' },
  { key: 'green', css: 'var(--green)' },
  { key: 'purple', css: 'var(--purple)' },
  { key: 'amber', css: 'var(--amber)' },
  { key: 'red', css: 'var(--red)' },
  { key: 'teal', css: 'var(--teal)' },
  { key: 'pink', css: 'var(--pink, #c0265e)' },
];