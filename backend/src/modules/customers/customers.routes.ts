import { Router } from 'express';
import * as controller from './customers.controller';
import { createCustomerSchema, updateCustomerSchema, addNoteSchema, listCustomerQuerySchema } from './customers.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

// All customer routes require login. Sales + Admin manage customers;
// Warehouse/Accounts can view (read-only) for cross-department visibility.
router.use(authenticate);

router.get('/', validate(listCustomerQuerySchema), controller.list);
router.get('/:id', controller.getById);
router.post('/', authorize('ADMIN', 'SALES'), validate(createCustomerSchema), controller.create);
router.put('/:id', authorize('ADMIN', 'SALES'), validate(updateCustomerSchema), controller.update);
router.post('/:id/notes', authorize('ADMIN', 'SALES'), validate(addNoteSchema), controller.addNote);

export default router;
