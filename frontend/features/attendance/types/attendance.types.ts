/**
 * Re-exports Attendance types from the service layer.
 * Keeps feature/types path consistent with other modules.
 */
export type {
  AttendanceStatus,
  AttendanceSource,
  AttendanceRecord,
  TodaySummary,
  RegularizationStatus,
  RegularizationRequest,
  MSSQLDayStatus,
  MSSQLAttendanceRow,
  AttendanceQueryParams,
  MarkAttendanceDto,
  UpdateAttendanceDto,
  BulkMarkResult,
  CreateRegularizationDto,
  ReviewRegularizationDto,
  EmployeeAttendanceQueryParams,
  PaginationMeta,
} from '../../../services/api/attendance.service';