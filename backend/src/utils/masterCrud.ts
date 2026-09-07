/**
 * Shared guards for the single-field "master / lookup" tables
 * (Gender, Bank, House Type, Salutation, Insured Amount, …).
 *
 * These modules historically let bad input reach Sequelize, surfacing as an
 * unhandled 500 ("Cannot read properties of undefined") or a raw
 * "Validation error". Routing everything through AppError gives the same
 * clean 400 / 404 / 409 responses the rest of the API already returns.
 */
import { Op } from 'sequelize';
import { AppError } from '../middleware/errorHandler.middleware';

/** Trim + require a name-like field. Throws 400 when empty/missing. */
export function requireName(raw: unknown, label = 'Name'): string {
  const value = String(raw ?? '').trim();
  if (!value) throw new AppError(`${label} is required`, 400);
  return value;
}

/** Throw 404 when a lookup by id came back empty. */
export function assertFound<T>(item: T | null | undefined, label: string): T {
  if (!item) throw new AppError(`${label} not found`, 404);
  return item;
}

/**
 * Throw 409 if any of `fields` already matches another row.
 * `fields` is OR-matched (e.g. { name, code }); `excludeId` skips the row
 * being updated.
 */
export async function assertUniqueMaster(
  Model: { findOne: (opts: any) => Promise<any> },
  fields: Record<string, unknown>,
  label: string,
  excludeId?: number,
): Promise<void> {
  const or = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => ({ [k]: v }));
  if (or.length === 0) return;
  const where: any = { [Op.or]: or };
  if (excludeId != null) where.id = { [Op.ne]: excludeId };
  const existing = await Model.findOne({ where });
  if (existing) {
    throw new AppError(`${label} "${fields.name ?? Object.values(fields)[0]}" already exists`, 409);
  }
}
