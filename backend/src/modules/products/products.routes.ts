import { Router } from 'express';
import * as controller from './products.controller';
import { createProductSchema, updateProductSchema, stockMovementSchema, listProductQuerySchema } from './products.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', validate(listProductQuerySchema), controller.list);
router.get('/:id', controller.getById);

// Admin and Warehouse own product master data + stock.
router.post('/', authorize('ADMIN', 'WAREHOUSE'), validate(createProductSchema), controller.create);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), validate(updateProductSchema), controller.update);
router.post('/:id/stock-movements', authorize('ADMIN', 'WAREHOUSE'), validate(stockMovementSchema), controller.recordMovement);

export default router;
