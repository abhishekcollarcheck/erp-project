import { Request, Response, NextFunction, raw } from "express";
import { validationResult } from "express-validator";
import multer from "multer";
import * as XLSX from "XLSX";
import { sendResponse, sendError, sendPaginated } from "../../utils/response";
import { employeeService } from "./employee.service";
import type { StepKey } from "./employee.constants";
import { AppError } from "../../middleware/errorHandler.middleware";
import fs from "fs";
import path from "path";
const MAX_ROWS = 5000;
const REQUIRED_HEADERS = ['employee_code'];
// ─── Multer (bulk upload only — in-memory) ────────────────────────────────────
const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (["XLSX", "xls", "csv"].includes(ext || "")) cb(null, true);
    else cb(new AppError("Only Excel/CSV files allowed", 400));
  },
}).single("file");

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
    const emp = await employeeService.getById(
      Number(req.params.id),
      req.user!.companyId,
      req.user!.isSuperAdmin,
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
      console.error("UPDATE STEP ERROR");
      console.error("BODY:", req.body);
      console.error("NAME:", error.name);
      console.error("MESSAGE:", error.message);
      console.error("PARENT:", error.parent);
      console.error("ORIGINAL:", error.original);

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
      console.error("UPDATE STEP ERROR");
      console.error("BODY:", req.body);
      console.error("NAME:", error.name);
      console.error("MESSAGE:", error.message);
      console.error("PARENT:", error.parent);
      console.error("ORIGINAL:", error.original);

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

  async nextCode(req: Request, res: Response) {
    const codes = await employeeService.getNextCode(req.user!.companyId);
    sendResponse(res, { data: codes });
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
    const perms = await employeeService.getFieldPermissions(req.user!.roleId);
    sendResponse(res, { data: perms });
  },

  async summary(req: Request, res: Response) {
    const s = await employeeService.getSummary(req.user!.companyId);
    sendResponse(res, { data: s });
  },

  async saveDraft(req: Request, res: Response) {
    const draft = await employeeService.saveDraft({
      employeeId: req.body.employee_id ?? null,
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

bulkUpload: async function(
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
}

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
