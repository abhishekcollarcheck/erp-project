// import { Router } from 'express';
// import { validate }                  from '../../middleware/validate.middleware';
// import { authenticate} from '../auth/auth.middleware';
// import {
//   getDesignations, getDesignationStats, getDesignation,
//   createDesignation, updateDesignation, toggleDesignation, deleteDesignation,
// } from './designation.controller';
// import {
//   createDesignationValidation, updateDesignationValidation,
//   listDesignationValidation, idValidation,
// } from './designation.validation';

// const router = Router();
// router.use(authenticate);

// // GET /api/designations?department_id=1&is_active=true|false|all&search=eng
// router.get('/', listDesignationValidation, validate, getDesignations);

// // GET /api/designations/stats  — MUST come before /:id
// router.get('/stats', getDesignationStats);

// // GET /api/designations/:id
// router.get('/:id', idValidation, validate, getDesignation);

// // POST /api/designations
// router.post('/', createDesignationValidation, validate, createDesignation);

// // PUT /api/designations/:id
// router.put('/:id', updateDesignationValidation, validate,  updateDesignation);

// // PATCH /api/designations/:id/toggle — activate / deactivate
// router.patch('/:id/toggle', idValidation, validate, toggleDesignation);

// // DELETE /api/designations/:id
// router.delete('/:id', idValidation, validate, deleteDesignation);

// export default router;



// import { Router } from 'express';
// import { DesignationController } from './designation.controller';

// const router = Router();
// const designationController = new DesignationController();

// // ==========================================
// // DESIGNATION ROUTES
// // ==========================================

// // GET /api/designations - Get all designations (optional query param: ?include_inactive=true)
// router.get('/designations', designationController.getAllDesignations);

// // GET /api/designations/:id - Get a single designation by ID
// router.get('/designations/:id', designationController.getDesignationById);

// // POST /api/designations - Create a new designation
// router.post('/designations', designationController.createDesignation);

// // PUT /api/designations/:id - Update an existing designation
// router.put('/designations/:id', designationController.updateDesignation);

// // DELETE /api/designations/:id - Soft delete a designation
// router.delete('/designations/:id', designationController.deleteDesignation);

// // ==========================================
// // SUB-DESIGNATION ROUTES
// // ==========================================

// // GET /api/sub-designations - Get sub-designations (optional params: ?designation_id=1&is_active=true&search=term)
// router.get('/sub-designations', designationController.getAllSubDesignations);

// // GET /api/sub-designations/:id - Get a single sub-designation by ID
// router.get('/sub-designations/:id', designationController.getSubDesignationById);

// // POST /api/sub-designations - Create a sub-designation under a parent designation
// router.post('/sub-designations', designationController.createSubDesignation);

// // PUT /api/sub-designations/:id - Update a sub-designation
// router.put('/sub-designations/:id', designationController.updateSubDesignation);

// // DELETE /api/sub-designations/:id - Soft delete a sub-designation
// router.delete('/sub-designations/:id', designationController.deleteSubDesignation);

// export default router;





















// import { Router } from 'express';
// import { DesignationController } from './designation.controller';

// const router = Router();
// const controller = new DesignationController();

// // Designation Routes
// router.get('/designations', controller.getAll);
// router.get('/designations/:id', controller.getById);
// router.post('/designations', controller.create);
// router.put('/designations/:id', controller.update);
// router.delete('/designations/:id', controller.delete);

// // Sub-Designation Routes
// router.get('/sub-designations', controller.getAllSubDesignations);
// router.post('/sub-designations', controller.createSubDesignation);
// router.put('/sub-designations/:id', controller.updateSubDesignation);
// router.delete('/sub-designations/:id', controller.deleteSubDesignation);

// export default router;



import { Router } from 'express';
import { DesignationController } from './designation.controller';

const router = Router();
const controller = new DesignationController();

// Designation Routes


// Sub-Designation Routes
router.get('/sub-designations', (req, res, next) => controller.getAllSubDesignations(req, res, next));
router.get('/sub-designations/:id', (req, res, next) => controller.getSubDesignationById(req, res, next));
router.post('/sub-designations', (req, res, next) => controller.createSubDesignation(req, res, next));
router.put('/sub-designations/:id', (req, res, next) => controller.updateSubDesignation(req, res, next));
router.delete('/sub-designations/:id', (req, res, next) => controller.deleteSubDesignation(req, res, next));

router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));
router.post('', (req, res, next) => controller.create(req, res, next));
router.put('/:id', (req, res, next) => controller.update(req, res, next));
router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

export default router;