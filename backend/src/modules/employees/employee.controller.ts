import { Request, Response, NextFunction, raw } from "express";
import { validationResult } from "express-validator";
import multer from "multer";
import * as XLSX from "xlsx";
import { sendResponse, sendError, sendPaginated } from "../../utils/response";
import { employeeService } from "./employee.service";
import type { StepKey } from "./employee.constants";
import { AppError } from "../../middleware/errorHandler.middleware";
import fs from "fs";
import path from "path";
const MAX_ROWS = 5000;
const REQUIRED_HEADERS = ['first_name', 'last_name', 'email', 'phone', 'department', 'designation'];

// ─── Multer (IDs & Bank document uploads — in-memory) ─────────────────────────
export const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (["pdf", "jpg", "jpeg", "png"].includes(ext || "")) cb(null, true);
    else cb(new AppError("Only PDF, JPG, or PNG files allowed", 400));
  },
}).single("file");

// ─── Multer (Profile photo upload — in-memory) ────────────────────────────────
export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "webp"].includes(ext || "")) cb(null, true);
    else cb(new AppError("Only JPG, PNG, or WebP files allowed", 400));
  },
}).single("avatar");

// ─── Validation error extractor ───────────────────────────────────────────────
function checkErrors(req: Request, res: Response): boolean {
  const errs = validationResult(req);
  if (errs.isEmpty()) return false;
  const map: Record<string, string[]> = {};
  errs.array().forEach((e) => {
    const f = (e as any).path || "general";
    (map[f] = map[f] || []).push(e.msg);
  });
  sendError(res, "Validation failed", 422, map);
  return true;
}

export const employeeController = {
  async getAll(req: Request, res: Response) {
    if (checkErrors(req, res)) return;
    const result = await employeeService.getAll(
      req.query as any,
      req.user!.companyId,
      req.user!.isSuperAdmin,
    );
    sendPaginated(res, result.rows, result.meta);
  },

  async getById(req: Request, res: Response) {
    if (checkErrors(req, res)) return;
    const u = req.user!;
    const canSeeSensitive =
      u.isSuperAdmin ||
      (u.permissions ?? []).includes('employees:edit') ||
      (u.permissions ?? []).includes('*') ||
      ['hr_manager', 'admin'].includes(u.roleSlug);
    const emp = await employeeService.getById(
      Number(req.params.id),
      u.companyId,
      canSeeSensitive,
    );
    sendResponse(res, { data: emp });
  },

  async create(req: Request, res: Response) {
    try {
      if (checkErrors(req, res)) return;
      const emp = await employeeService.create(
        { ...req.body, company_id: req.body.company_id },
        req.user!.employeeId,
        req.ip,
      );
      sendResponse(res, {
        data: emp,
        message: "Employee created",
        statusCode: 201,
      });
    } catch (error: any) {
      console.error("CREATE EMPLOYEE ERROR:", error.name, "-", error.message);
      throw error;
    }
  },

  async updateStep(req: Request, res: Response) {
    try {
      if (checkErrors(req, res)) return;
      const step = req.params.step as StepKey;
      const emp = await employeeService.updateStep(
        Number(req.params.id),
        req.user!.companyId,
        step,
        req.body,
        req.user!.employeeId,
        req.ip,
      );
      sendResponse(res, { data: emp, message: `${step} saved` });
    } catch (error: any) {
      console.error("UPDATE STEP ERROR:", error.name, "-", error.message);
      throw error;
    }
  },

  async remove(req: Request, res: Response) {
    if (checkErrors(req, res)) return;
    await employeeService.delete(
      Number(req.params.id),
      req.user!.companyId,
      req.user!.employeeId,
    );
    sendResponse(res, { data: null, message: "Employee removed" });
  },

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      if (checkErrors(req, res)) return;
      const result = await employeeService.transferEmployee(
        Number(req.params.id),
        req.user!.companyId,
        req.body,
        req.user!.employeeId,
        req.ip,
      );
      sendResponse(res, { data: result, message: 'Employee transferred', statusCode: 201 });
    } catch (e) { next(e); }
  },

  async managersSearch(req: Request, res: Response) {
    const { q, exclude } = req.query;
    if (!q || String(q).trim().length < 2) {
      sendResponse(res, { data: [] });
      return;
    }
    const results = await employeeService.searchManagers(
      String(q).trim(),
      req.user!.companyId,
      exclude ? Number(exclude) : undefined,
    );
    sendResponse(res, { data: results });
  },

  async managerById(req: Request, res: Response) {
    const mgr = await employeeService.getManagerById(
      Number(req.params.id),
      req.user!.companyId,
    );
    sendResponse(res, { data: mgr });
  },

  async fieldPermissions(req: Request, res: Response) {
  const moduleKey = (req.query.module as string) || 'employees';
  const perms = await employeeService.getFieldPermissions(req.user!.employeeId, moduleKey);
  sendResponse(res, { data: perms });
},

  async summary(req: Request, res: Response) {
    const s = await employeeService.getSummary(req.user!.companyId);
    sendResponse(res, { data: s });
  },

  async saveDraft(req: Request, res: Response) {
    const draft = await employeeService.saveDraft({
      employeeId: req.body.employee_id ?? null,
      companyId: req.user!.companyId,
      actorId: req.user!.employeeId,
      step: req.body.step,
      formData: req.body.form_data,
      sessionId: req.body.session_id,
    });
    sendResponse(res, { data: draft, message: "Draft saved" });
  },

  async getDraft(req: Request, res: Response) {
    const draft = await employeeService.getDraft(
      req.params.sessionId,
      req.user!.employeeId,
    );
    sendResponse(res, { data: draft });
  },

  async discardDraft(req: Request, res: Response) {
    await employeeService.discardDraft(
      req.params.sessionId,
      req.user!.employeeId,
    );
    sendResponse(res, { data: null, message: "Draft discarded" });
  },

  // ─── Role & Identity: profile photo upload ────────────────────────────────
  async uploadProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { sendError(res, 'No file uploaded', 400); return; }
      const dir = path.join(process.cwd(), 'uploads', 'employee-avatars', String(req.params.id));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `avatar-${Date.now()}${path.extname(req.file.originalname)}`;
      fs.writeFileSync(path.join(dir, filename), req.file.buffer);
      const avatarUrl = `/uploads/employee-avatars/${req.params.id}/${filename}`;
      await employeeService.uploadProfilePhoto(Number(req.params.id), req.user!.companyId, avatarUrl, req.user!.employeeId);
      sendResponse(res, { data: { avatar_url: avatarUrl }, message: 'Profile photo uploaded' });
    } catch (e) { next(e); }
  },

  // ─── IDs & Bank: upload a scan for Aadhaar/PAN/Passport/Driving Licence ────
  async uploadIdDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { sendError(res, 'No file uploaded', 400); return; }
      const docType = req.params.docType as 'aadhaar' | 'pan' | 'passport' | 'drivingLicense';
      const dir = path.join(process.cwd(), 'uploads', 'employee-docs', String(req.params.id));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `${docType}-${Date.now()}${path.extname(req.file.originalname)}`;
      fs.writeFileSync(path.join(dir, filename), req.file.buffer);
      const fileUrl = `/uploads/employee-docs/${req.params.id}/${filename}`;
      await employeeService.uploadIdDocument(Number(req.params.id), req.user!.companyId, docType, fileUrl, req.user!.employeeId);
      sendResponse(res, { data: { file_url: fileUrl }, message: 'Document uploaded' });
    } catch (e) { next(e); }
  },

  // ─── IDs & Bank: "Additional documents" repeatable list ──────────────────
  async uploadExtraDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) { sendError(res, 'No file uploaded', 400); return; }
      const { doc_type, doc_type_other } = req.body;
      if (!doc_type) { sendError(res, 'doc_type is required', 400); return; }
      const dir = path.join(process.cwd(), 'uploads', 'employee-docs', String(req.params.id));
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filename = `extra-${Date.now()}${path.extname(req.file.originalname)}`;
      fs.writeFileSync(path.join(dir, filename), req.file.buffer);
      const fileUrl = `/uploads/employee-docs/${req.params.id}/${filename}`;
      await employeeService.addExtraDocument(Number(req.params.id), req.user!.companyId, doc_type, doc_type_other || null, fileUrl, req.user!.employeeId);
      sendResponse(res, { data: { file_url: fileUrl }, message: 'Document uploaded' });
    } catch (e) { next(e); }
  },

  bulkUpload: async function (
    req: Request,
    res: Response,
    next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        sendError(res, 'No file uploaded', 400);
        return;
      }

      const ext = path
        .extname(req.file.originalname)
        .toLowerCase();

      let rows: any[] = [];

      // ─────────────────────────────────────────────
      // CSV Parsing
      // ─────────────────────────────────────────────

      if (ext === '.csv') {
        const fileContent = fs.readFileSync(
          req.file.path,
          'utf-8',
        );

        const lines = fileContent
          .split('\n')
          .filter(l => l.trim());

        if (lines.length < 2) {
          sendError(
            res,
            'CSV must contain a header row and at least one data row',
            400,
          );

          return;
        }

        const headers = lines[0]
          .split(',')
          .map(h =>
            h
              .trim()
              .replace(/^"|"$/g, '')
              .toLowerCase()
              .replace(/\s+/g, '_'),
          );

        rows = lines.slice(1).map(line => {
          const values: string[] = [];

          let current = '';
          let inQuotes = false;

          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }

          values.push(current.trim());

          return Object.fromEntries(
            headers.map((h, i) => [
              h,
              (values[i] || '').replace(/^"|"$/g, ''),
            ]),
          );
        });
      }

      // ─────────────────────────────────────────────
      // XLS / XLSX Parsing
      // ─────────────────────────────────────────────

      else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.readFile(req.file.path, {
          cellDates: true,
        });

        const sheetName = workbook.SheetNames[0];

        if (!sheetName) {
          sendError(
            res,
            'Excel file does not contain any sheets',
            400,
          );

          return;
        }

        const worksheet = workbook.Sheets[sheetName];

        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });
        rows = rows.map((row: any) => {
          const normalized: any = {};

          Object.keys(row).forEach(key => {
            const normalizedKey = key
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '_');

            normalized[normalizedKey] = row[key];
          });

          return normalized;
        });

        if (!rows.length) {
          sendError(
            res,
            'Excel file must contain at least one data row',
            400,
          );

          return;
        }
      }

      // ─────────────────────────────────────────────
      // Unsupported File
      // ─────────────────────────────────────────────

      else {
        sendError(
          res,
          'Unsupported file format. Please upload CSV or Excel file.',
          400,
        );

        return;
      }

      // ─────────────────────────────────────────────
      // Header Validation
      // ─────────────────────────────────────────────

      if (!rows.length || !Object.keys(rows[0]).length) {
        sendError(
          res,
          'File contains invalid or empty headers',
          400,
        );

        return;
      }

      const fileHeaders = Object.keys(rows[0]);

      const missingHeaders = REQUIRED_HEADERS.filter(
        h => !fileHeaders.includes(h),
      );

      if (missingHeaders.length) {
        sendError(
          res,
          `Missing required columns: ${missingHeaders.join(', ')}`,
          400,
        );

        return;
      }

      // ─────────────────────────────────────────────
      // Row Limit Validation
      // ─────────────────────────────────────────────

      if (rows.length > MAX_ROWS) {
        sendError(
          res,
          `Maximum ${MAX_ROWS} rows allowed per upload`,
          400,
        );

        return;
      }

      // ─────────────────────────────────────────────
      // Upload
      // ─────────────────────────────────────────────

      const result = await employeeService.bulkUpload(
        rows,
        req.user!.companyId,
        req.user!.employeeId,
      );

      sendResponse(res, {
        data: result,

        message:
          `Bulk upload complete: ` +
          `${result.success} added, ` +
          `${result.failed} failed`,

        statusCode:
          result.failed === 0 ? 201 : 207,
      });

    } catch (e) {
      next(e);
    }

    // ─────────────────────────────────────────────
    // Cleanup Temp File
    // ─────────────────────────────────────────────

    finally {
      try {
        if (
          req.file?.path &&
          fs.existsSync(req.file.path)
        ) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error(
          'Failed to cleanup uploaded file:',
          cleanupError,
        );
      }
    }
  },

  // downloadTemplate(_req: Request, res: Response) {
  //   const headers = [
  //     "first_name*",
  //     "last_name*",
  //     "employment_type (Permanent/Contractual)",
  //     "working_city",
  //     "actual_doj (YYYY-MM-DD)",
  //     "department",
  //     "designation",
  //   ];
  //   const wb = XLSX.utils.book_new();
  //   const ws = XLSX.utils.aoa_to_sheet([
  //     headers,
  //     [
  //       "Rahul",
  //       "Sharma",
  //       "Permanent",
  //       "Mumbai",
  //       "2024-01-15",
  //       "Commercial",
  //       "Executive",
  //     ],
  //   ]);
  //   XLSX.utils.book_append_sheet(wb, ws, "Employees");
  //   const buf = XLSX.write(wb, { type: "buffer", bookType: "XLSX" });
  //   res.setHeader(
  //     "Content-Disposition",
  //     'attachment; filename="employee_import_template.XLSX"',
  //   );
  //   res.setHeader(
  //     "Content-Type",
  //     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   );
  //   res.send(buf);
  // },

  // ─────────────────────────────────────────────────────────────────────────────
  // Full-field bulk import (all ~180 columns). Reuses the wizard pipeline —
  // per-row validation via STEP_VALIDATORS, per-row transaction, calculations,
  // and employee_code generation. Separate from the legacy `bulkUpload` above,
  // which stays untouched.
  // ─────────────────────────────────────────────────────────────────────────────

  bulkImportTemplate: async function (_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { buildTemplateWorkbook } = await import('./bulkImport.service');
      const buf = buildTemplateWorkbook();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="employee_bulk_import_template.xlsx"');
      res.send(buf);
    } catch (e) { next(e); }
  },

  bulkImportFields: async function (_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { allTemplateColumns } = await import('./bulkImport.fields');
      const { Company } = await import('../../database/models/Company');
      // Company master for the template's Company dropdown. Same set the bulk
      // import resolver accepts (see bulkImport.mapper.ts → buildResolvers),
      // so the dropdown options == the values the importer will accept.
      const companies = await Company.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
        raw: true,
      });
      sendResponse(res, { data: { columns: allTemplateColumns(), companies } });
    } catch (e) { next(e); }
  },

  bulkImport: async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    let filePath: string | undefined;
    try {
      if (!req.file) { sendError(res, 'No file uploaded', 400); return; }
      filePath = req.file.path;
      const buf = fs.readFileSync(filePath);

      const { runBulkImport, buildErrorWorkbook } = await import('./bulkImport.service');
      const result = await runBulkImport(buf, req.user!.companyId, req.user!.employeeId);

      const errorFileBase64 = result.errors.length
        ? buildErrorWorkbook(result.errors).toString('base64')
        : undefined;

      sendResponse(res, {
        data: { ...result, errorFileBase64 },
        message: `Bulk import complete: ${result.createdCount} created, ${result.updated} updated, ${result.failed} failed`,
        statusCode: result.failed === 0 ? 201 : 207,
      });
    } catch (e) {
      next(e);
    } finally {
      if (filePath) { try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* ignore */ } }
    }
  },
};

export async function getManagedEmployees(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { Employee } = await import("../../database/models/Employee");
    const { CompanyManager } =
      await import("../../database/models/CompanyManager");
    const { Op } = await import("sequelize");

    const employeeId = req.user!.employeeId;
    const isSuperAdmin = req.user!.isSuperAdmin;

    let companyIds = [];

    if (isSuperAdmin) {
      const { Company } = await import("../../database/models/Company");
      const companies = await Company.findAll({
        where: { is_active: true },
        attributes: ["id"],
      });
      companyIds = companies.map((c: any) => c.id);
    } else {
      const assignments = await CompanyManager.findAll({
        where: { employee_id: employeeId },
        attributes: ["company_id"],
      });
      companyIds = assignments.map((c: any) => c.company_id);
    }

    if (!companyIds.length) {
      sendResponse(res, { data: [] });
      return;
    }

    const search = (req.query.search as string) || "";

    const employees = await Employee.findAll({
      where: {
        company_id: { [Op.in]: companyIds },
        status: "Active",
        portal_access: true,
        ...(search
          ? {
            [Op.or]: [
              { first_name: { [Op.like]: `%${search}%` } },
              { last_name: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
            ],
          }
          : {}),
      },
      attributes: [
        "id",
        "first_name",
        "last_name",
        "email",
        "employee_code",
        "company_id",
      ],
      order: [["first_name", "ASC"]],
      limit: 100,
    });

    sendResponse(res, { data: employees });
  } catch (error) {
    next(error);
  }
}