// src/modules/sub-designations/sub-designation.module.ts

/**
 * SubDesignation Module - Barrel Exports
 *
 * Usage:
 * import { SubDesignationService, subDesignationRoutes } from '@/modules/sub-designations';
 */

export { SubDesignationService } from './subDesignation.service';
export type {
  CreateSubDesignationDto,
  UpdateSubDesignationDto,
  SubDesignationQueryParams,
} from './subDesignation.service';

export {
  getSubDesignations,
  getSubDesignationStats,
  getSubDesignation,
  createSubDesignation,
  updateSubDesignation,
  // toggleSubDesignation,
  deleteSubDesignation,
} from './subDesignation.controller';

export { default as subDesignationRoutes } from './subDesignation.routes';