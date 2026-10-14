import { api } from '@/services/apiClient';
import type { AdminRole } from '@/types/auth';

/** Owner-only user management (there must always be one active Owner — enforced by the server). */
export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  isSelf: boolean;
  createdAt: string | null;
}

export function fetchUsers(): Promise<ManagedUser[]> {
  return api<ManagedUser[]>('GET', '/admin/users');
}

export function createUser(input: { name: string; email: string; role: AdminRole }): Promise<ManagedUser> {
  return api<ManagedUser>('POST', '/admin/users', input);
}

export function updateUser(id: number, input: { name?: string; role?: AdminRole }): Promise<ManagedUser> {
  return api<ManagedUser>('PATCH', `/admin/users/${id}`, input);
}

export function setUserActive(id: number, isActive: boolean): Promise<ManagedUser> {
  return api<ManagedUser>('PATCH', `/admin/users/${id}/status`, { isActive });
}

export function sendPasswordLink(id: number): Promise<{ message: string }> {
  return api<{ message: string }>('POST', `/admin/users/${id}/password-link`);
}

export function deleteUser(id: number): Promise<void> {
  return api<void>('DELETE', `/admin/users/${id}`);
}
