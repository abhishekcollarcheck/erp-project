import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../modules/auth/auth.middleware';
import { getSubDepartment, getSubDepartments, createSubDepartment, updateSubDepartment, deleteSubDepartment } from './subDepartment.controller';
import { listSubDepartmentValidation, idValidation, createSubDepartmentValidation, updateSubDepartmentValidation } from "./subDepartment.validation"

const router = Router();
router.use(authenticate);

router.get('/', listSubDepartmentValidation, validate, getSubDepartments);
router.get('/:id', idValidation, validate, getSubDepartment);
router.post('/', createSubDepartmentValidation, validate, createSubDepartment);
router.put('/:id', updateSubDepartmentValidation, validate, updateSubDepartment);
router.delete('/:id', idValidation, validate, deleteSubDepartment);

export default router;