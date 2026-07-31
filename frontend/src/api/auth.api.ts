import { api } from './client';

export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data as { token: string; user: AuthUser };
}

export async function registerUser(name: string, email: string, password: string, role: Role) {
  const res = await api.post('/auth/register', { name, email, password, role });
  return res.data.data as AuthUser;
}
