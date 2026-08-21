import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../auth/auth.middleware";
import { employeeOverrideRouter, patchGroupMembersWithOverrideCounts, } from "./permissionGroupOverrides";
import { getMyGroups, listGroups } from "./permissionGroups.controller";
import { createGroup, updateGroup, deleteGroup, getGroupPermissions, setGroupPermissions, getGroupMembers, addGroupMember, removeGroupMember } from "./permissionGroups.controller";
import { validate } from "../../middleware/validate.middleware";
import { sendResponse } from "../../utils/response";
import { FormBuilderService } from "../form-builder/formBuilder.service";

const fbSvc = new FormBuilderService();

export const permissionGroupRouter = Router();
permissionGroupRouter.use(authenticate);
permissionGroupRouter.use(employeeOverrideRouter);

permissionGroupRouter.get("/me", getMyGroups);
permissionGroupRouter.get("/", authorize('settings:view'), listGroups);
permissionGroupRouter.post("/", authorize('settings:edit'), [body("name").trim().notEmpty()], validate, createGroup,);
permissionGroupRouter.put("/:id", authorize('settings:edit'), [param("id").isInt()], validate, updateGroup);
permissionGroupRouter.delete("/:id", authorize('settings:delete'), [param("id").isInt()], validate, deleteGroup,);
permissionGroupRouter.get("/:id/permissions", authorize('settings:view'), [param("id").isInt()],validate,getGroupPermissions);
permissionGroupRouter.put("/:id/permissions", authorize('settings:edit'), [param("id").isInt(), body("slugs").isArray(), body("companyIds").isArray(), body("companyIds.*").isInt(),],validate,setGroupPermissions);
permissionGroupRouter.get("/:id/members", authorize('settings:view'), [param("id").isInt()],validate,getGroupMembers,);
permissionGroupRouter.post("/:id/members", authorize('settings:edit'), [param("id").isInt(), body("employee_id").isInt()],validate,addGroupMember);
permissionGroupRouter.delete("/:id/members/:employeeId", authorize('settings:delete'), [param("id").isInt(), param("employeeId").isInt()],validate,removeGroupMember,);

permissionGroupRouter.get("/company-modules", authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = +(req.query.company_id || req.user!.companyId);
      const rows = await fbSvc.listModules(companyId);
      sendResponse(res, { data: rows });
    } catch (e) {
      next(e);
    }
  },
);
patchGroupMembersWithOverrideCounts(permissionGroupRouter);