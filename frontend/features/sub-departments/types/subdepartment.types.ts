/**
 * Re-exports SubDepartment types from the service layer.
 * Keeps feature/types path consistent with other modules.
 */
export type {
  SubDepartment,
  CreateSubDepartmentDto,
  UpdateSubDepartmentDto,
  SubDepartmentQueryParams,
} from '../../../services/api/subDepartment.service';