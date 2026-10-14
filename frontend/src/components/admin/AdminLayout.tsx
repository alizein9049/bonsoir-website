import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '@/components/brand/BrandLogo';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/admin.css';
import './AdminLayout.css';

interface NavEntry {
  label: string;
  to?: string;
  ownerOnly?: boolean;
  /** not built yet — shown to the Owner as "Soon" */
  soon?: boolean;
}

const NAV: NavEntry[] = [
  { label: 'Menu items', to: ROUTES.adminHome },
  { label: 'Categories', to: ROUTES.adminCategories, ownerOnly: true },
  { label: 'Branding', to: ROUTES.adminBranding, ownerOnly: true },
  { label: 'Users', to: ROUTES.adminUsers, ownerOnly: true },
];

/**
 * Admin shell: sidebar on desktop (≥992px), collapsible menu on phones/tablets.
 * Owner-only sections are hidden from Menu Editors. (The server also enforces this.)
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setNavOpen(false), [location.pathname]);

  const isOwner = user?.role === 'owner';
  const entries = NAV.filter((e) => !e.ownerOnly || isOwner);

  async function handleLogout() {
    await logout();
    navigate(ROUTES.adminLogin, { replace: true });
  }

  return (
    <div className="bn-admin bn-shell">
      <a href="#admin-main" className="visually-hidden-focusable bn-skip">
        Skip to content
      </a>

      <header className="bn-shell__topbar">
        <div className="bn-shell__brand">
          <BrandLogo size="sm" priority />
          <span>Bonsoir Admin</span>
        </div>
        <button
          type="button"
          className="bn-shell__menu-btn"
          aria-expanded={navOpen}
          aria-controls="admin-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
            {navOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          <span className="visually-hidden">{navOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </header>

      <aside id="admin-nav" className={`bn-shell__sidebar${navOpen ? ' is-open' : ''}`} aria-label="Admin">
        <div className="bn-shell__brand bn-shell__brand--side">
          <BrandLogo size="sm" />
          <span>Bonsoir Admin</span>
        </div>

        <nav className="bn-shell__nav">
          <ul role="list">
            {entries.map((e) => (
              <li key={e.label}>
                {e.to && !e.soon ? (
                  <NavLink to={e.to} end className={({ isActive }) => `bn-shell__link${isActive ? ' is-active' : ''}`}>
                    {e.label}
                  </NavLink>
                ) : (
                  <span className="bn-shell__link is-disabled" aria-disabled="true">
                    {e.label}
                    <span className="bn-soon">Soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="bn-shell__footer">
          <a href={ROUTES.welcome} target="_blank" rel="noreferrer" className="bn-shell__view">
            View public menu
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
          <div className="bn-shell__user">
            <span className="bn-shell__user-name">{user?.name}</span>
            <span className="bn-role">{isOwner ? 'Owner' : 'Menu Editor'}</span>
          </div>
          <button type="button" className="btn btn-outline-secondary w-100 bn-btn-44" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main id="admin-main" className="bn-shell__main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
