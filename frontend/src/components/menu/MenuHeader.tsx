import { Link } from 'react-router-dom';
import BrandLogo from '@/components/brand/BrandLogo';
import { ROUTES } from '@/config/routes';
import './MenuHeader.css';

/** Slim header (scrolls away): small logo + Back to the Welcome Page. */
export default function MenuHeader() {
  return (
    <header className="bn-menu-header">
      <div className="container bn-menu-header__inner">
        <Link to={ROUTES.welcome} className="bn-menu-header__back" aria-label="Back to the welcome page">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          <span>Back</span>
        </Link>
        <BrandLogo size="sm" priority />
        <span className="bn-menu-header__spacer" aria-hidden="true" />
      </div>
    </header>
  );
}
