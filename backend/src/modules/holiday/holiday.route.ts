import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { createHoliday, deleteHoliday, getHolidayById, getHolidays, updateHoliday } from './holiday.Controller';

const router = Router();

// Same assumption as leave.routes.ts — swap for your real auth middleware
// name/path if 'authenticate' isn't it.
router.use(authenticate);

// Route order: /:id must come after any literal-segment paths if you add
// more later (none needed yet — this module only has id-based routes).
router.get('/', getHolidays);
router.post('/', createHoliday);
router.get('/:id', getHolidayById);
router.put('/:id', updateHoliday);
router.delete('/:id', deleteHoliday);

export default router;