import { maskPartial } from '../../utils/validationEngine';

/**
 * Shared field-perm shape used by every Form* component's `fieldPerm` prop.
 * `is_masked` = full mask (value hidden entirely), `is_partial_masked` = show
 * first 2 + last 2 characters only. Full wins when both are set.
 */
export interface FieldPerm {
  can_view?:          boolean;
  can_add?:           boolean;
  can_edit?:          boolean;
  can_copy?:          boolean;
  can_download?:      boolean;
  is_masked?:         boolean;
  is_partial_masked?: boolean;
}

export type MaskKind = 'none' | 'full' | 'partial';

export function maskKind(fp?: FieldPerm): MaskKind {
  if (fp?.is_masked) return 'full';
  if (fp?.is_partial_masked) return 'partial';
  return 'none';
}

/**
 * What to render for a possibly-masked value.
 *   - none    → the real value, editable per can_edit
 *   - full    → a password-style obscured control, locked
 *   - partial → the partially-masked string as read-only text, locked
 */
export function maskedView(raw: unknown, fp?: FieldPerm): {
  kind: MaskKind;
  locked: boolean;        // value cannot be changed (mask or !can_edit)
  noCopy: boolean;
  text: string;           // what to display (partial) — ignored for full/none
} {
  const kind = maskKind(fp);
  const noCopy = fp?.can_copy === false || kind !== 'none';
  const locked = kind !== 'none' || fp?.can_edit === false;
  const text = kind === 'partial' ? maskPartial(raw as any) : String(raw ?? '');
  return { kind, locked, noCopy, text };
}
