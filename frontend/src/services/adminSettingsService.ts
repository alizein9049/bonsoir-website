import { api } from '@/services/apiClient';

/** Branding shown on the public site (GET /api/v1/settings/public). */
export interface PublicSettings {
  /** null = the official logo shipped with the website */
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export interface AdminSettings extends PublicSettings {
  defaults: { primaryColor: string; secondaryColor: string };
}

export type LogoChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; file: File };

export function fetchPublicSettings(): Promise<PublicSettings> {
  return api<PublicSettings>('GET', '/settings/public');
}

export function fetchAdminSettings(): Promise<AdminSettings> {
  return api<AdminSettings>('GET', '/admin/settings');
}

export function saveBranding(input: { primaryColor: string; secondaryColor: string; logo: LogoChange }): Promise<AdminSettings> {
  const f = new FormData();
  f.set('primaryColor', input.primaryColor);
  f.set('secondaryColor', input.secondaryColor);
  f.set('logoAction', input.logo.kind);
  if (input.logo.kind === 'replace') f.set('logo', input.logo.file);
  return api<AdminSettings>('POST', '/admin/settings/branding', f);
}
