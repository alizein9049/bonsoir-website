import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { UNAUTHORIZED_EVENT } from '@/services/apiClient';
import * as authService from '@/services/authService';
import type { AdminUser, LoginCredentials } from '@/types/auth';

export interface AuthContextValue {
  /** undefined = still checking the session; null = signed out */
  user: AdminUser | null | undefined;
  login: (credentials: LoginCredentials) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    authService
      .getCurrentUser()
      .then((u) => !cancelled && setUser(u))
      .catch(() => !cancelled && setUser(null));
    // A 401 from any admin request (session expired, account disabled) → back to sign-in.
    const onUnauthorized = () => !cancelled && setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const u = await authService.login(credentials);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
