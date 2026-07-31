import { api } from './client';

export async function getDashboardSummary() {
  const res = await api.get('/dashboard/summary');
  return res.data.data;
}
