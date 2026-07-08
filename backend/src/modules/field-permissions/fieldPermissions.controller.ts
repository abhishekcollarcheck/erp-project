import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../../utils/response";
import { GroupFieldPermissionServices } from "./fieldPermissions.service";

const svc = new GroupFieldPermissionServices();

export async function getGroupPermissionMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.getGroupPermissionMatrix(req.user!.companyId, +req.params.formId);
    sendResponse(res, { success: true, data, message: "Success", errors: null });
  } catch (e) {
    next(e);
  }
}

export async function setGroupFieldPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await svc.setGroupFieldPermission(
      req.user!.companyId,
      +req.body.group_id,
      +req.params.fieldId,
      req.body,
      req.user!.employeeId,
    );
    sendResponse(res, { success: true, data, message: "Success", errors: null });
  } catch (e) {
    next(e);
  }
}