import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const PaymentStatusPage = lazy(() => import("@/pages/PaymentStatusPage"));

export const publicRoutes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <AuthPage /> },
  { path: "/lupa-sandi", element: <ForgotPasswordPage /> },
  { path: "/reset-sandi", element: <ResetPasswordPage /> },
  { path: "/checkout", element: <CheckoutPage /> },
  { path: "/payment/status", element: <PaymentStatusPage /> },
];
