import { api } from './client';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  createdAt: string;
}

export interface CustomerListParams {
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  page?: number;
  limit?: number;
}

export async function listCustomers(params: CustomerListParams) {
  const res = await api.get('/customers', { params });
  return { items: res.data.data as Customer[], meta: res.data.meta };
}

export async function getCustomer(id: string) {
  const res = await api.get(`/customers/${id}`);
  return res.data.data;
}

export async function createCustomer(payload: Partial<Customer>) {
  const res = await api.post('/customers', payload);
  return res.data.data as Customer;
}

export async function updateCustomer(id: string, payload: Partial<Customer>) {
  const res = await api.put(`/customers/${id}`, payload);
  return res.data.data as Customer;
}

export async function addCustomerNote(id: string, note: string) {
  const res = await api.post(`/customers/${id}/notes`, { note });
  return res.data.data;
}
