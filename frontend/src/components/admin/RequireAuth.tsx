import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

/**
 * Protects admin pages in the browser (redirects to sign-in).
 * NOTE: real protection is enforced by the Laravel API — this only improves UX.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) {
    return (
      <div className="bn-admin d-flex align-items-center justify-content-center" role="status">
        <div className="spinner-border text-success" aria-hidden="true" />
        <span className="visually-hidden">Checking your session…</span>
      </div>
    );
  }
  if (!user) {
    return <Navigate to={ROUTES.adminLogin} replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
