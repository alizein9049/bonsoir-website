import type { ReactNode } from 'react';
import BrandLogo from '@/components/brand/BrandLogo';
import '@/styles/admin.css';
import './AdminAuthLayout.css';

export interface AdminAuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Centred card shell shared by the admin sign-in and password screens. */
export default function AdminAuthLayout({ title, subtitle, children }: AdminAuthLayoutProps) {
  return (
    <div className="bn-admin bn-auth">
      <main className="bn-auth__main" aria-labelledby="auth-title">
        <div className="bn-auth__card">
          <div className="bn-auth__brand">
            <BrandLogo size="md" priority />
            <p className="bn-auth__eyebrow">Bonsoir Admin</p>
            <h1 id="auth-title" className="bn-auth__title">
              {title}
            </h1>
            {subtitle && <p className="bn-auth__subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
