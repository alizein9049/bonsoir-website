import { useContext } from 'react';
import { BrandingContext } from '@/app/BrandingProvider';

export function useBranding() {
  return useContext(BrandingContext);
}
