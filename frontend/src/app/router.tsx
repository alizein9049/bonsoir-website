import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import RequireAuth from '@/components/admin/RequireAuth';
import RequireOwner from '@/components/admin/RequireOwner';
import { ROUTES } from '@/config/routes';
import AdminBrandingPage from '@/pages/admin/AdminBrandingPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminForgotPasswordPage from '@/pages/admin/AdminForgotPasswordPage';
import AdminHomePage from '@/pages/admin/AdminHomePage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminResetPasswordPage from '@/pages/admin/AdminResetPasswordPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import ItemFormDialog from '@/pages/admin/ItemFormDialog';
import MenuPage from '@/pages/public/MenuPage';
import WelcomePage from '@/pages/public/WelcomePage';

export const router = createBrowserRouter(
  [
    // Customer site
    { path: ROUTES.welcome, element: <WelcomePage /> },
    { path: ROUTES.menu, element: <MenuPage /> },

    // Admin — public screens
    { path: ROUTES.adminLogin, element: <AdminLoginPage /> },
    { path: ROUTES.adminForgotPassword, element: <AdminForgotPasswordPage /> },
    { path: ROUTES.adminResetPassword, element: <AdminResetPasswordPage /> },

    // Admin — signed-in area (shared sidebar layout)
    {
      path: ROUTES.adminHome,
      element: (
        <RequireAuth>
          <AdminLayout />
        </RequireAuth>
      ),
      children: [
        {
          // Dashboard stays on screen; the item form opens over it as a dialog.
          element: <AdminHomePage />,
          children: [
            { index: true, element: null },
            { path: 'items/new', element: <ItemFormDialog /> },
            { path: 'items/:id/edit', element: <ItemFormDialog /> },
          ],
        },
        // Owner only
        {
          path: 'categories',
          element: (
            <RequireOwner>
              <AdminCategoriesPage />
            </RequireOwner>
          ),
        },
        {
          path: 'branding',
          element: (
            <RequireOwner>
              <AdminBrandingPage />
            </RequireOwner>
          ),
        },
        {
          path: 'users',
          element: (
            <RequireOwner>
              <AdminUsersPage />
            </RequireOwner>
          ),
        },
      ],
    },

    // Unknown addresses fall back to the Welcome Page (QR codes always land on "/").
    { path: '*', element: <Navigate to={ROUTES.welcome} replace /> },
  ],
  {
    // Opt in to React Router v7 behaviour now (removes the dev-console "future flag" warnings).
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
