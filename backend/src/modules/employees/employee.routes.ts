import { Request, Response, Router, NextFunction } from 'express';
import {employeeController} from "./employee.controller"
import { authenticate, resolveCompanyContext } from '../auth/auth.middleware';
import { asyncHandler } from '../../middleware/errorHandler.middleware';
import { rbacCheck } from '../../middleware/rbac.middleware';
import {getManagedEmployees} from "./employee.controller";
import fs from 'fs';
import multer         from 'multer';
import path           from 'path';
import { env } from '../../config/env';

import {
  listValidation, idValidation, STEP_VALIDATORS,
} from './employee.validation';

// ─── Multer: CSV bulk ─────────────────────────────────────────────────────────
const bulkDir = path.join(process.cwd(), env.upload.dir, 'bulk');
if (!fs.existsSync(bulkDir)) fs.mkdirSync(bulkDir, { recursive: true });

const allowedExtensions = ['.csv', '.xlsx', '.xls'];

export const bulkUpload = multer({
  dest: bulkDir,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return cb(
        new Error(
          'Only CSV, XLSX and XLS files are allowed',
        ),
      );
    }

    cb(null, true);
  },
});

export const employeeRoutes = Router();
employeeRoutes.use(authenticate);
employeeRoutes.use(resolveCompanyContext)

// Static routes — ALL must be declared before /:id to avoid param collision
employeeRoutes.get('/summary',              asyncHandler(employeeController.summary));
employeeRoutes.get('/next-code',            asyncHandler(employeeController.nextCode));
employeeRoutes.get('/field-permissions',    asyncHandler(employeeController.fieldPermissions));
// employeeRoutes.get('/template',             employeeController.downloadTemplate);

// Manager search (must be before /:id — otherwise Express treats 'search' as an id param)
employeeRoutes.get('/managers/search',      asyncHandler(employeeController.managersSearch));
employeeRoutes.get('/managers/:id',         asyncHandler(employeeController.managerById));

// Draft
employeeRoutes.post('/draft',                asyncHandler(employeeController.saveDraft));
employeeRoutes.get('/draft/:sessionId',      asyncHandler(employeeController.getDraft));
employeeRoutes.delete('/draft/:sessionId',   asyncHandler(employeeController.discardDraft));

// Bulk
// employeeRoutes.get('/bulk-upload/template',  employeeController.downloadTemplate);
employeeRoutes.post('/bulk-upload', bulkUpload.single('file'), employeeController.bulkUpload,);

// CRUD
employeeRoutes.get('/',
  listValidation,
  asyncHandler(employeeController.getAll),
);

employeeRoutes.get('/managed', getManagedEmployees);

employeeRoutes.post('/',
  asyncHandler(employeeController.create),
);

employeeRoutes.get('/:id',
  idValidation,
  asyncHandler(employeeController.getById),
);

employeeRoutes.delete('/:id',
  idValidation,
  asyncHandler(employeeController.remove),
);

// Step update — dynamic validation by step name
employeeRoutes.patch('/:id/step/:step',
  idValidation,
  (req: Request, res: Response, next: NextFunction) => {
    const validators = STEP_VALIDATORS[req.params.step] || [];
    console.log("validators", validators)
    if (!validators.length) return next();
    // Run validators sequentially
    Promise.all(validators.map((v: any) => v.run(req)))
      .then(() => next())
      .catch(next);
  },
  asyncHandler(employeeController.updateStep),
);