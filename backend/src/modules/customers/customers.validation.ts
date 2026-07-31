import { z } from 'zod';

const customerBase = {
  name: z.string().min(2, 'Name is required'),
  mobile: z.string().min(7, 'Valid mobile number is required'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().datetime().optional().or(z.literal('')),
};

export const createCustomerSchema = z.object({
  body: z.object(customerBase),
});

export const updateCustomerSchema = z.object({
  body: z.object(customerBase).partial(),
  params: z.object({ id: z.string().uuid() }),
});

export const addNoteSchema = z.object({
  body: z.object({ note: z.string().min(1, 'Note text is required') }),
  params: z.object({ id: z.string().uuid() }),
});

export const listCustomerQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
    customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
