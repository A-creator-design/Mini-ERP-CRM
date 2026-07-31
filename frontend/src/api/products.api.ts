import { api } from './client';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location?: string | null;
  createdAt: string;
}

export interface ProductListParams {
  search?: string;
  category?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export async function listProducts(params: ProductListParams) {
  const res = await api.get('/products', { params });
  return { items: res.data.data as Product[], meta: res.data.meta };
}

export async function getProduct(id: string) {
  const res = await api.get(`/products/${id}`);
  return res.data.data;
}

export async function createProduct(payload: Partial<Product>) {
  const res = await api.post('/products', payload);
  return res.data.data as Product;
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  const res = await api.put(`/products/${id}`, payload);
  return res.data.data as Product;
}

export async function recordStockMovement(id: string, quantity: number, movementType: 'IN' | 'OUT', reason: string) {
  const res = await api.post(`/products/${id}/stock-movements`, { quantity, movementType, reason });
  return res.data.data;
}
