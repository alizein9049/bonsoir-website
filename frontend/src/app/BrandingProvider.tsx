import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchPublicSettings, type PublicSettings } from '@/services/adminSettingsService';
import { blendHex, contrastRatio, hexToRgb } from '@/utils/color';

/** Approved colours (theme.css). When the saved branding equals these, nothing is overridden. */
export const DEFAULT_PRIMARY = '#32000C';
export const DEFAULT_SECONDARY = '#3F6A2E';
const DARK_CARD = '#4A1820'; // dark-mode card surface (theme.css)

const BRAND_VARS = [
  '--bn-brand-primary',
  '--bn-brand-secondary',
  '--bn-brand-secondary-rgb',
  '--bn-brand-secondary-hover',
  '--bn-brand-secondary-active',
  '--bn-brand-secondary-tint',
];

/** Applies the Owner's brand colours to the whole site (theme.css reads --bn-brand-*). */
export function applyBrandColors(primary: string, secondary: string): void {
  const root = document.documentElement.style;
  const isDefault = primary.toUpperCase() === DEFAULT_PRIMARY && secondary.toUpperCase() === DEFAULT_SECONDARY;
  if (isDefault) {
    BRAND_VARS.forEach((v) => root.removeProperty(v));
  } else {
    // Light tint of the button colour that stays readable as text on dark-mode cards.
    let tint = secondary;
    for (let mix = 0.3; mix <= 0.95 && contrastRatio(tint, DARK_CARD) < 4.5; mix += 0.05) tint = blendHex(secondary, '#FFFFFF', mix);
    const values: Record<string, string> = {
      '--bn-brand-primary': primary,
      '--bn-brand-secondary': secondary,
      '--bn-brand-secondary-rgb': hexToRgb(secondary).join(', '),
      '--bn-brand-secondary-hover': blendHex(secondary, '#FFFFFF', 0.12),
      '--bn-brand-secondary-active': blendHex(secondary, '#000000', 0.15),
      '--bn-brand-secondary-tint': tint,
    };
    Object.entries(values).forEach(([k, v]) => root.setProperty(k, v));
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', primary);
}

interface BrandingContextValue {
  /** null while loading or when the server can't be reached (approved defaults are shown) */
  settings: PublicSettings | null;
  refresh: () => Promise<void>;
}

export const BrandingContext = createContext<BrandingContextValue>({ settings: null, refresh: async () => {} });

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await fetchPublicSettings();
      setSettings(s);
      applyBrandColors(s.primaryColor, s.secondaryColor);
    } catch {
      /* keep the approved defaults */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
