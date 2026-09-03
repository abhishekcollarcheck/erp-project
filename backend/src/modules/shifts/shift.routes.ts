// /**
//  * shift.routes.ts
//  *
//  * Place at: backend/src/modules/shifts/shift.routes.ts
//  * Register: app.use('/api/shifts', shiftRouter);
//  */

// import { Router, Request, Response, NextFunction } from 'express';
// import { authenticate } from '../auth/auth.middleware';
// import { shiftService } from './shift.service';
// import { sendResponse, sendError } from '../../utils/response';

// const shiftRouter = Router();
// shiftRouter.use(authenticate);

// // GET /api/shifts — active shift list, for dropdowns (e.g. StepEmployment)
// shiftRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const shifts = await shiftService.listActive();
//     sendResponse(res, { data: shifts, message: `${shifts.length} active shift(s)` });
//   } catch (e: any) {
//     sendError(res, `Failed to fetch shifts: ${e.message}`, 500);
//   }
// });

// export default shiftRouter;


import { Router } from 'express';
import { shiftController } from './shift.controller';

const router = Router();

router.get('/', shiftController.getAll);
router.get('/:id', shiftController.getById);
router.post('/', shiftController.create);
router.put('/:id', shiftController.update);
router.delete('/:id', shiftController.delete);

export default router;