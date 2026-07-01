import { getIO } from "../socket/socket";

export async function refreshEmployeeCompanies(employeeId: number) {
    getIO()?.to(`employee:${employeeId}`).emit("companies:updated", {
        eventType: "companies_updated",
        timestamp: new Date().toISOString(),
    });
}