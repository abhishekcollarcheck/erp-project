/**
 * companySettings.controller.ts
 *
 * Two endpoints:
 *   GET  /companies/:id/settings      — get all settings for a company
 *   PUT  /companies/:id/settings      — upsert one or more settings
 *   PUT  /companies/:id/theme         — update theme_color (Company table)
 *
 * Mounted inside company.routes.ts:
 *   companyRouter.get('/:id/settings',  authenticate, requireSuperAdmin, getSettings);
 *   companyRouter.put('/:id/settings',  authenticate, requireSuperAdmin, updateSettings);
 *   companyRouter.put('/:id/theme',     authenticate, requireSuperAdmin, updateTheme);
 */

import { Request, Response, NextFunction } from 'express';
import { Company, CompanySetting }         from '../../database/models/Company';
import { sendResponse, sendError }         from '../../utils/response';
import { logActivity }                     from '../../utils/activityLogger';

// ─── GET /companies/:id/settings ─────────────────────────────────────────────

export async function getSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = +req.params.id;

    const [company, settings] = await Promise.all([
      Company.findOne({
        where:      { id: companyId },
        attributes: ['id', 'name', 'theme_color', 'timezone', 'currency', 'date_format', 'fiscal_year'],
      }),
      CompanySetting.findAll({
        where:      { company_id: companyId },
        attributes: ['key', 'value', 'updated_at'],
        order:      [['key', 'ASC']],
      }),
    ]);

    if (!company) { sendError(res, 'Company not found', 404); return; }

    // Return as a flat object for easy frontend consumption
    const settingsMap: Record<string, string | null> = {};
    for (const s of settings) settingsMap[s.key] = s.value;

    sendResponse(res, {
      data: {
        // Core company fields
        theme_color:  company.theme_color,
        timezone:     company.timezone,
        currency:     company.currency,
        date_format:  company.date_format,
        fiscal_year:  company.fiscal_year,
        // Flexible key-value settings
        ...settingsMap,
      },
    });
  } catch (e) { next(e); }
}

// ─── PUT /companies/:id/settings ─────────────────────────────────────────────
// Body: { key: value, key2: value2, ... }
// Upserts each key-value pair into company_settings

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = +req.params.id;
    const actorId   = req.user!.employeeId;
    const body      = req.body as Record<string, string | null>;

    if (!body || typeof body !== 'object') {
      sendError(res, 'Body must be a key-value object', 400);
      return;
    }

    // Core company fields — handled on Company table directly
    const COMPANY_FIELDS = ['timezone', 'currency', 'date_format', 'fiscal_year'] as const;
    const companyUpdates: Record<string, string> = {};
    const settingEntries: { key: string; value: string | null }[] = [];

    for (const [key, value] of Object.entries(body)) {
      if ((COMPANY_FIELDS as readonly string[]).includes(key)) {
        companyUpdates[key] = value as string;
      } else {
        settingEntries.push({ key, value });
      }
    }

    // Update Company table fields if any
    if (Object.keys(companyUpdates).length > 0) {
      await Company.update(companyUpdates, { where: { id: companyId } });
    }

    // Upsert each setting into company_settings
    for (const { key, value } of settingEntries) {
      await CompanySetting.upsert({
        company_id: companyId,
        key,
        value,
        updated_by: actorId,
      });
    }

    await logActivity({
      companyId,
      employeeId: actorId,
      action:     'COMPANY_SETTINGS_UPDATED',
      module:     'settings',
      entityId:   companyId,
      newValues:  body,
    });

    sendResponse(res, { message: 'Settings updated' });
  } catch (e) { next(e); }
}

// ─── PUT /companies/:id/theme ─────────────────────────────────────────────────
// Body: { theme_color: '#1e56d9' }

export async function updateTheme(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId  = +req.params.id;
    const { theme_color } = req.body;

    if (!theme_color || !/^#[0-9a-fA-F]{3,6}$/.test(theme_color)) {
      sendError(res, 'Invalid theme_color — must be a hex color like #1e56d9', 400);
      return;
    }

    await Company.update({ theme_color }, { where: { id: companyId } });

    await logActivity({
      companyId,
      employeeId: req.user!.employeeId,
      action:     'COMPANY_THEME_UPDATED',
      module:     'settings',
      entityId:   companyId,
      newValues:  { theme_color },
    });

    sendResponse(res, { data: { theme_color }, message: 'Theme updated' });
  } catch (e) { next(e); }
}