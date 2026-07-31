import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { customersService } from './customers.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, customerType, page, limit } = req.query;
  const result = await customersService.list({
    search: search as string | undefined,
    status: status as 'LEAD' | 'ACTIVE' | 'INACTIVE' | undefined,
    customerType: customerType as 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR' | undefined,
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
  const customer = await customersService.getById(req.params.id);
  sendSuccess(res, 200, customer);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = { ...req.body };
  if (body.followUpDate) body.followUpDate = new Date(body.followUpDate);
  else delete body.followUpDate;
  const customer = await customersService.create(body);
  sendSuccess(res, 201, customer);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = { ...req.body };
  if (body.followUpDate) body.followUpDate = new Date(body.followUpDate);
  const customer = await customersService.update(req.params.id, body);
  sendSuccess(res, 200, customer);
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await customersService.addNote(req.params.id, req.body.note, req.user!.userId);
  sendSuccess(res, 201, note);
});
