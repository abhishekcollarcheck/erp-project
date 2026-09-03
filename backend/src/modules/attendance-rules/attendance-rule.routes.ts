import { Router } from 'express';
import { attendanceRulesController } from './attendance-rule.controller';

const router = Router();

// ─── SATURDAY RULES ROUTES ─────────────────────────────────────────────────
router.get(
  '/saturday-rules',
  attendanceRulesController.getAllSaturdayRules
);
router.post(
  '/saturday-rules',
  attendanceRulesController.createSaturdayRule
);
router.put(
  '/saturday-rules/:id',
  attendanceRulesController.updateSaturdayRule
);
router.delete(
  '/saturday-rules/master',
  attendanceRulesController.deleteAllSaturdayRules
);
router.delete(
  '/saturday-rules/:id',
  attendanceRulesController.deleteSaturdayRule
);

// ─── GRACE MINUTES ROUTES ──────────────────────────────────────────────────
router.get(
  '/grace-minutes',
  attendanceRulesController.getAllGraceMinutes
);
router.post(
  '/grace-minutes',
  attendanceRulesController.createGraceMinute
);
router.put(
  '/grace-minutes/:id',
  attendanceRulesController.updateGraceMinute
);
router.delete(
  '/grace-minutes/master',
  attendanceRulesController.deleteAllGraceMinutes
);
router.delete(
  '/grace-minutes/:id',
  attendanceRulesController.deleteGraceMinute
);

// ─── ATTENDANCE TYPES ROUTES ───────────────────────────────────────────────
router.get(
  '/attendance-types',
  attendanceRulesController.getAllAttendanceTypes
);
router.post(
  '/attendance-types',
  attendanceRulesController.createAttendanceType
);
router.put(
  '/attendance-types/:id',
  attendanceRulesController.updateAttendanceType
);
router.delete(
  '/attendance-types/master',
  attendanceRulesController.deleteAllAttendanceTypes
);
router.delete(
  '/attendance-types/:id',
  attendanceRulesController.deleteAttendanceType
);

export default router;