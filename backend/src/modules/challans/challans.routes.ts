import { Router } from 'express';
import * as controller from './challans.controller';
import { createChallanSchema, changeStatusSchema, listChallanQuerySchema } from './challans.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', validate(listChallanQuerySchema), controller.list);
router.get('/:id', controller.getById);
router.get('/:id/pdf', controller.downloadPdf);

// Sales creates challans; Admin can too. Warehouse/Accounts are read-only here.
router.post('/', authorize('ADMIN', 'SALES'), validate(createChallanSchema), controller.create);
router.patch('/:id/status', authorize('ADMIN', 'SALES', 'WAREHOUSE'), validate(changeStatusSchema), controller.changeStatus);

export default router;
