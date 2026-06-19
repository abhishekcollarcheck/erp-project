import { loadPermissions } from "../modules/auth/auth.service";
import { generateAccessToken } from "./jwt";
import { getIO } from "../socket/socket";

export async function refreshEmployeePermission(employeeId: number, companyId:number) {
 const {permissions, isSuperAdmin} = await loadPermissions(employeeId, companyId)   

 const freshToken = generateAccessToken({
    employeeId,
    companyId,
    permissions,
    isSuperAdmin
 } as any)
const room = getIO()?.sockets.adapter.rooms.get(
  `employee:${employeeId}`
);

console.log(
  "ROOM CHECK",
  `employee:${employeeId}`,
  room?.size
);
 getIO()?.to(`employee:${employeeId}`).emit(
    'permissions:updated', {
      eventType: 'permissions_updated',
      companyId,
      permissions,
      accessToken: freshToken,
      timestamp: new Date().toISOString(),   
    }
 )
}