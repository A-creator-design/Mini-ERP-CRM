import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { challansService } from './challans.service';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { streamChallanPdf } from '../../utils/pdfInvoice';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { status, customerId, page, limit } = req.query;
  const result = await challansService.list({
    status: status as any,
    customerId: customerId as string | undefined,
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
  const challan = await challansService.getById(req.params.id);
  sendSuccess(res, 200, challan);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, items, status } = req.body;
  const challan = await challansService.create(customerId, items, status, req.user!.userId);
  sendSuccess(res, 201, challan);
});

export const changeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const challan = await challansService.changeStatus(req.params.id, status, req.user!.userId);
  sendSuccess(res, 200, challan);
});

// Bonus: export confirmed/draft challan as a downloadable PDF invoice.
export const downloadPdf = asyncHandler(async (req: Request, res: Response) => {
  const challan = await prisma.challan.findUnique({
    where: { id: req.params.id },
    include: { customer: true, createdBy: { select: { name: true } }, items: true },
  });
  if (!challan) throw ApiError.notFound('Challan not found');
  streamChallanPdf(res, challan as any);
});
