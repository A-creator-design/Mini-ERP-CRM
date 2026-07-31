import { z } from 'zod';

const productBase = {
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  minStockAlert: z.number().int().nonnegative().default(0),
  location: z.string().optional(),
};

export const createProductSchema = z.object({
  body: z.object({ ...productBase, currentStock: z.number().int().nonnegative().default(0) }),
});

export const updateProductSchema = z.object({
  body: z.object(productBase).partial(),
  params: z.object({ id: z.string().uuid() }),
});

export const stockMovementSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be a positive number'),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().min(1, 'Reason is required'),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const listProductQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    lowStock: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
