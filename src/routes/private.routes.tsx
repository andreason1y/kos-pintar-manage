import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { OnboardingGuard } from "@/guards/OnboardingGuard";

const DashboardPage       = lazy(() => import("@/pages/DashboardPage"));
const KamarPage           = lazy(() => import("@/pages/KamarPage"));
const PenyewaPage         = lazy(() => import("@/pages/PenyewaPage"));
const PembayaranPage      = lazy(() => import("@/pages/PembayaranPage"));
const KeuanganPage        = lazy(() => import("@/pages/KeuanganPage"));
const ProfilPage          = lazy(() => import("@/pages/ProfilPage"));
const OnboardingPage      = lazy(() => import("@/pages/OnboardingPage"));
const CheckoutPage        = lazy(() => import("@/pages/CheckoutPage"));
const CheckoutSuksesPage  = lazy(() => import("@/pages/CheckoutSuksesPage"));

/**
 * Private routes - requires authentication and at least one property
 * Routes without OnboardingGuard are accessible even without properties
 */
export const privateRoutes: RouteObject[] = [
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/beranda",
    element: (
      <OnboardingGuard>
        <DashboardPage />
      </OnboardingGuard>
    ),
  },
  {
    path: "/kamar",
    element: (
      <OnboardingGuard>
        <KamarPage />
      </OnboardingGuard>
    ),
  },
  {
    path: "/penyewa",
    element: (
      <OnboardingGuard>
        <PenyewaPage />
      </OnboardingGuard>
    ),
  },
  {
    path: "/pembayaran",
    element: (
      <OnboardingGuard>
        <PembayaranPage />
      </OnboardingGuard>
    ),
  },
  {
    path: "/keuangan",
    element: (
      <OnboardingGuard>
        <KeuanganPage />
      </OnboardingGuard>
    ),
  },
  {
    path: "/profil",
    element: (
      <OnboardingGuard>
        <ProfilPage />
      </OnboardingGuard>
    ),
  },
  // Checkout routes — no OnboardingGuard (accessible before property is set up)
  {
    path: "/checkout",
    element: <CheckoutPage />,
  },
  {
    path: "/checkout/sukses",
    element: <CheckoutSuksesPage />,
  },
];
