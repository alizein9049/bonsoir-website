import { ApiError, api, ensureCsrf } from '@/services/apiClient';
import { AuthError, type AdminUser, type LoginCredentials } from '@/types/auth';

/**
 * Admin authentication — Laravel Sanctum cookie session with CSRF protection.
 *   GET /sanctum/csrf-cookie → POST /api/v1/auth/login · POST /auth/logout · GET /auth/me
 */

export async function login({ email, password }: LoginCredentials): Promise<AdminUser> {
  try {
    await ensureCsrf(true);
    const user = await api<AdminUser>('POST', '/auth/login', { email, password });
    await ensureCsrf(true); // the session (and its token) is renewed at sign-in
    return user;
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.status === 0) throw new AuthError('network', e.message);
    if (e.status === 429) throw new AuthError('rate_limited', e.message);
    if (e.status === 403) throw new AuthError('account_disabled', e.message);
    if (e.status === 422) throw new AuthError('invalid_credentials', e.fieldErrors.email ?? e.message);
    throw new AuthError('network', e.message);
  }
}

export async function logout(): Promise<void> {
  try {
    await api<void>('POST', '/auth/logout');
  } finally {
    await ensureCsrf(true).catch(() => undefined);
  }
}

/** The signed-in admin, or null when signed out. */
export async function getCurrentUser(): Promise<AdminUser | null> {
  return api<AdminUser | null>('GET', '/auth/me');
}

export function requestPasswordLink(email: string): Promise<{ message: string }> {
  return api<{ message: string }>('POST', '/auth/forgot-password', { email });
}

export function resetPassword(input: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  return api<{ message: string }>('POST', '/auth/reset-password', input);
}
