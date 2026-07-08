import { Router } from "express";
import { body, param } from "express-validator";
import { authenticate } from "../auth/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { getGroupPermissionMatrix, setGroupFieldPermission } from "./fieldPermissions.controller";

export const groupFieldPermissionRouter = Router();
groupFieldPermissionRouter.use(authenticate);

groupFieldPermissionRouter.get(
  "/forms/:formId/group-permission-matrix",
  [param("formId").isInt()],
  validate,
  getGroupPermissionMatrix,
);

groupFieldPermissionRouter.put(
  "/fields/:fieldId/group-permissions",
  [param("fieldId").isInt(), body("group_id").isInt()],
  validate,
  setGroupFieldPermission,
);