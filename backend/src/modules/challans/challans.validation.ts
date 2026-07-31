import { z } from 'zod';

const challanItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Valid customer is required'),
    items: z.array(challanItemSchema).min(1, 'At least one product is required'),
    status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  }),
});

export const updateChallanItemsSchema = z.object({
  body: z.object({
    items: z.array(challanItemSchema).min(1, 'At least one product is required'),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const changeStatusSchema = z.object({
  body: z.object({ status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']) }),
  params: z.object({ id: z.string().uuid() }),
});

export const listChallanQuerySchema = z.object({
  query: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
    customerId: z.string().uuid().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
