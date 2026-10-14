/** Admin roles (approved): Owner = everything; Editor = products & featured only. */
export type AdminRole = 'owner' | 'editor';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Why a login failed — mirrors the planned API status codes (422/401, 429, network). */
export type AuthErrorKind = 'invalid_credentials' | 'account_disabled' | 'rate_limited' | 'network';

export class AuthError extends Error {
  constructor(
    public readonly kind: AuthErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
