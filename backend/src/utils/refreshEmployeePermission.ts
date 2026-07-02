import { loadPermissions } from "../modules/auth/auth.service";
import { generateAccessToken } from "./jwt";
import { getIO } from "../socket/socket";

export async function refreshEmployeePermission(
  employeeId: number,
  companyIds: number[],
) {
  for (const companyId of companyIds) {
    try {
      const { permissions, isSuperAdmin } = await loadPermissions(
        employeeId,
        companyId,
      );

      const freshToken = generateAccessToken({
        employeeId,
        companyId,
        permissions,
        isSuperAdmin,
      } as any);

      console.log(
        `Emitting permissions for company ${companyId} -> employee:${employeeId}`,
      );

      getIO()
        ?.to(`employee:${employeeId}`)
        .emit("permissions:updated", {
          eventType: "permissions_updated",
          companyId,
          permissions,
          accessToken: freshToken,
          timestamp: new Date().toISOString(),
        });
    } catch (err) {
      console.warn(
        `[Permission Refresh] Failed for employee ${employeeId}, company ${companyId}`,
        err,
      );
    }
  }
}