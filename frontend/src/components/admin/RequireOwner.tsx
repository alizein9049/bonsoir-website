import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Owner-only section. Menu Editors see a clear "no access" message instead.
 * NOTE: the real block is enforced by the Laravel API (403) — this is the browser side.
 */
export default function RequireOwner({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === 'owner') return <>{children}</>;
  return <NoAccess />;
}

function NoAccess() {
  useDocumentTitle('No access');
  return (
    <div className="bn-admin-state" role="alert">
      <h1 className="h4 mb-1" style={{ color: 'var(--bn-admin-text)' }}>You don’t have access to this page</h1>
      <p className="mb-3">Only the Owner can manage categories, branding and users.</p>
      <Link to={ROUTES.adminHome} className="btn btn-primary bn-btn-44" style={{ display: 'inline-flex', alignItems: 'center' }}>
        Go to menu items
      </Link>
    </div>
  );
}
