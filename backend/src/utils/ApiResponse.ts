import { Response } from 'express';

export function sendSuccess(res: Response, statusCode: number, data: unknown, meta?: Record<string, unknown>) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}
