import { Router } from 'express';
import * as authController from './auth.controller';
import { loginSchema, registerSchema } from './auth.validation';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);

// Only an Admin can provision new employee logins.
router.post('/register', authenticate, authorize('ADMIN'), validate(registerSchema), authController.register);

router.get('/me', authenticate, authController.me);

export default router;
