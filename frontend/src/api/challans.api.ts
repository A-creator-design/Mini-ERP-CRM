import { api } from './client';

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  status: ChallanStatus;
  totalQuantity: number;
  createdAt: string;
  customer: { name: string; businessName?: string | null };
  createdBy?: { name: string };
}

export async function listChallans(params: { status?: ChallanStatus; customerId?: string; page?: number; limit?: number }) {
  const res = await api.get('/challans', { params });
  return { items: res.data.data as Challan[], meta: res.data.meta };
}

export async function getChallan(id: string) {
  const res = await api.get(`/challans/${id}`);
  return res.data.data;
}

export async function createChallan(customerId: string, items: ChallanItemInput[], status: 'DRAFT' | 'CONFIRMED') {
  const res = await api.post('/challans', { customerId, items, status });
  return res.data.data;
}

export async function changeChallanStatus(id: string, status: ChallanStatus) {
  const res = await api.patch(`/challans/${id}/status`, { status });
  return res.data.data;
}

export function challanPdfUrl(id: string) {
  return `${api.defaults.baseURL}/challans/${id}/pdf`;
}
