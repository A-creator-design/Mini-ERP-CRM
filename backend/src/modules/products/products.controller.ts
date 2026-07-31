import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { productsService } from './products.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, lowStock, page, limit } = req.query;
  const result = await productsService.list({
    search: search as string | undefined,
    category: category as string | undefined,
    lowStock: lowStock === 'true',
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  sendSuccess(res, 200, result.items, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getById(req.params.id);
  sendSuccess(res, 200, product);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.create(req.body);
  sendSuccess(res, 201, product);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.update(req.params.id, req.body);
  sendSuccess(res, 200, product);
});

export const recordMovement = asyncHandler(async (req: Request, res: Response) => {
  const { quantity, movementType, reason } = req.body;
  const result = await productsService.recordMovement(req.params.id, quantity, movementType, reason, req.user!.userId);
  sendSuccess(res, 201, result);
});
