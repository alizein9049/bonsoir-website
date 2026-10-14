import { Link } from 'react-router-dom';
import BrandLogo from '@/components/brand/BrandLogo';
import { ROUTES } from '@/config/routes';
import { siteContent } from '@/config/siteContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './WelcomePage.css';

/**
 * Welcome Page — where the table QR codes land ("/").
 * Journey: QR → Welcome → Enter Menu → Main Menu.
 * Content is fixed (see src/config/siteContent.ts).
 */
export default function WelcomePage() {
  useDocumentTitle('Welcome');
  const { welcomeHeading, welcomeMessage, enterMenuLabel } = siteContent;

  return (
    <main className="bn-welcome" aria-labelledby="welcome-heading">
      <div className="bn-welcome__glow" aria-hidden="true" />

      <div className="container bn-welcome__inner d-flex flex-column align-items-center text-center">
        <BrandLogo size="lg" priority className="bn-welcome__logo bn-reveal" />

        <div className="bn-welcome__ornament bn-reveal" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <h1 id="welcome-heading" className="bn-welcome__title bn-reveal">
          {welcomeHeading}
        </h1>

        {welcomeMessage && <p className="bn-welcome__message bn-reveal">{welcomeMessage}</p>}

        <Link to={ROUTES.menu} className="btn btn-primary btn-lg bn-welcome__cta bn-reveal">
          <span>{enterMenuLabel}</span>
          <svg
            className="bn-welcome__cta-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
