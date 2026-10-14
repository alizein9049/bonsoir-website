import officialLogo from '@/assets/brand/bonsoir-logo-720.webp';
import { useBranding } from '@/hooks/useBranding';
import './BrandLogo.css';

export type BrandLogoSize = 'sm' | 'md' | 'lg';

export interface BrandLogoProps {
  /** sm ≈ header, md ≈ admin login, lg ≈ Welcome Page */
  size?: BrandLogoSize;
  /** Load immediately (above the fold) instead of lazily. */
  priority?: boolean;
  className?: string;
}

/**
 * The official Bonsoir logo, shown unaltered — or the logo the Owner uploaded in Branding.
 * The source file has black square corners; a circular frame hides them
 * without editing the image itself.
 */
export default function BrandLogo({ size = 'md', priority = false, className = '' }: BrandLogoProps) {
  const { settings } = useBranding();
  const logoSrc = settings?.logoUrl ?? officialLogo;
  return (
    <span className={`bn-logo bn-logo--${size} ${className}`.trim()}>
      <img
        src={logoSrc}
        alt="Bonsoir"
        width={720}
        height={720}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </span>
  );
}
