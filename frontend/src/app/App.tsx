import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/app/AuthProvider';
import { BrandingProvider } from '@/app/BrandingProvider';
import { router } from '@/app/router';

export default function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </AuthProvider>
    </BrandingProvider>
  );
}
