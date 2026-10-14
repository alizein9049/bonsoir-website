/** Single source of truth for app URLs. */
export const ROUTES = {
  welcome: '/',
  menu: '/menu',
  adminLogin: '/admin/login',
  adminForgotPassword: '/admin/forgot-password',
  adminResetPassword: '/admin/reset-password',
  adminHome: '/admin',
  adminCategories: '/admin/categories',
  adminBranding: '/admin/branding',
  adminUsers: '/admin/users',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
