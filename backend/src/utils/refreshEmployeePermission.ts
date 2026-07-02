import { loadPermissions } from "../modules/auth/auth.service";
import { generateAccessToken } from "./jwt";
import { getIO } from "../socket/socket";

export async function refreshEmployeePermission(
  employeeId: number,
  companyId: number,
) {
   console.log("========== SOCKET REFRESH ==========");
  console.log({ employeeId, companyId });
  try {
    const { permissions, isSuperAdmin } = await loadPermissions(
      employeeId,
      companyId,
    );
console.log("Permissions:", permissions);
    const freshToken = generateAccessToken({
      employeeId,
      companyId,
      permissions,
      isSuperAdmin,
    } as any);
 console.log("Emitting to room:", `employee:${employeeId}`);
    getIO()?.to(`employee:${employeeId}`).emit("permissions:updated", {
      eventType: "permissions_updated",
      companyId,
      permissions,
      accessToken: freshToken,
      timestamp: new Date().toISOString(),
    });
    console.log("Socket emitted successfully");
  } catch (err) {
    console.warn(
      "[Permission Refresh] Failed for employee",
      employeeId,
      err,
    );
  }
}