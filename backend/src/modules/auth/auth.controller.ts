import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { authService } from './auth.service';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  sendSuccess(res, 200, result);
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const user = await authService.register(name, email, password, role);
  sendSuccess(res, 201, user);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.userId);
  sendSuccess(res, 200, user);
});
