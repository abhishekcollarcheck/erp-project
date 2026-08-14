import { Router, Request, Response, NextFunction } from "express";
import { body, param } from "express-validator";
import { authenticate, authorize } from "../auth/auth.middleware";
import { employeeOverrideRouter, patchGroupMembersWithOverrideCounts, } from "./permissionGroupOverrides";
import { getMyGroups, listGroups } from "./permissionGroups.controller";
import { createGroup, updateGroup, deleteGroup, getGroupPermissions, setGroupPermissions, getGroupMembers, addGroupMember, removeGroupMember } from "./permissionGroups.controller";
import { validate } from "../../middleware/validate.middleware";
import { sendResponse } from "../../utils/response";
import { CompanyModule } from "../../database/models/PermissionGroups";

export const permissionGroupRouter = Router();
permissionGroupRouter.use(authenticate);
permissionGroupRouter.use(employeeOverrideRouter);

permissionGroupRouter.get("/me", getMyGroups);
permissionGroupRouter.get("/", listGroups);
permissionGroupRouter.post("/", [body("name").trim().notEmpty()], validate, createGroup,);
permissionGroupRouter.put("/:id", [param("id").isInt()], validate, updateGroup);
permissionGroupRouter.delete("/:id", [param("id").isInt()], validate, deleteGroup,);
permissionGroupRouter.get("/:id/permissions",[param("id").isInt()],validate,getGroupPermissions);
permissionGroupRouter.put("/:id/permissions",[param("id").isInt(), body("slugs").isArray()],validate,setGroupPermissions);
permissionGroupRouter.get("/:id/members",[param("id").isInt()],validate,getGroupMembers,);
permissionGroupRouter.post("/:id/members",[param("id").isInt(), body("employee_id").isInt()],validate,addGroupMember);
permissionGroupRouter.delete("/:id/members/:employeeId",[param("id").isInt(), param("employeeId").isInt()],validate,removeGroupMember,);

// GET /permission-groups/company-modules?company_id=N
permissionGroupRouter.get("/company-modules",authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = +(req.query.company_id || req.user!.companyId);
      let rows: any[] = await CompanyModule.findAll({
        where: { company_id: companyId, is_active: true },
        order: [["display_order", "ASC"]],
        attributes: ["module", "label"],
      });
      if (!rows.length)
        rows = [
          { module: "recruitment", label: "Recruitment / ATS" },
          { module: "aptitude", label: "Aptitude Test" },
          { module: "employees", label: "Employees" },
          { module: "department", label: "Department" },
          { module: "designation", label: "Designation" },
          // { module: "payroll", label: "Payroll" },
          // { module: "attendance", label: "Attendance" },
          // { module: "leaves", label: "Leave Management" },
          // { module: "assets", label: "Asset Management" },
          // { module: "analytics", label: "Analytics & Reports" },
          { module: "settings", label: "Settings & RBAC" },
        ];
      sendResponse(res, { data: rows });
    } catch (e) {
      next(e);
    }
  },
);
patchGroupMembersWithOverrideCounts(permissionGroupRouter);