import BrandLogo from '@/components/brand/BrandLogo';
import './MenuFooter.css';

/**
 * Footer. Address, phone and social links are PENDING from the owner —
 * until then only the logo and © Bonsoir are shown (no invented details).
 */
export default function MenuFooter() {
  return (
    <footer className="bn-menu-footer">
      <div className="container d-flex flex-column align-items-center gap-2">
        <BrandLogo size="sm" />
        <p className="bn-menu-footer__copy">© Bonsoir</p>
      </div>
    </footer>
  );
}
