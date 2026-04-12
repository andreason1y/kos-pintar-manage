import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * Public routes - accessible without authentication
 */
export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/lupa-sandi",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-sandi",
    element: <ResetPasswordPage />,
  },
];
