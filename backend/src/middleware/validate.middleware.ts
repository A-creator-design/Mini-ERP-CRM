import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validates req.body/query/params against a Zod schema.
 * Usage: router.post('/', validate(createCustomerSchema), controller.create)
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw ApiError.badRequest('Validation failed', err.flatten());
      }
      throw err;
    }
  };
}
