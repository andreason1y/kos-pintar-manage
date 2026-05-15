import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { OnboardingGuard } from "@/guards/OnboardingGuard";
import SubscriptionGuard from "@/guards/SubscriptionGuard";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const KamarPage = lazy(() => import("@/pages/KamarPage"));
const PenyewaPage = lazy(() => import("@/pages/PenyewaPage"));
const PembayaranPage = lazy(() => import("@/pages/PembayaranPage"));
const KeuanganPage = lazy(() => import("@/pages/KeuanganPage"));
const ProfilPage = lazy(() => import("@/pages/ProfilPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));

export const privateRoutes: RouteObject[] = [
  {
    path: "/onboarding",
    element: (
      <SubscriptionGuard>
        <OnboardingPage />
      </SubscriptionGuard>
    ),
  },
  {
    path: "/beranda",
    element: (
      <SubscriptionGuard>
        <OnboardingGuard>
          <DashboardPage />
        </OnboardingGuard>
      </SubscriptionGuard>
    ),
  },
  {
    path: "/kamar",
    element: (
      <SubscriptionGuard>
        <OnboardingGuard>
          <KamarPage />
        </OnboardingGuard>
      </SubscriptionGuard>
    ),
  },
  {
    path: "/penyewa",
    element: (
      <SubscriptionGuard>
        <OnboardingGuard>
          <PenyewaPage />
        </OnboardingGuard>
      </SubscriptionGuard>
    ),
  },
  {
    path: "/pembayaran",
    element: (
      <SubscriptionGuard>
        <OnboardingGuard>
          <PembayaranPage />
        </OnboardingGuard>
      </SubscriptionGuard>
    ),
  },
  {
    path: "/keuangan",
    element: (
      <SubscriptionGuard>
        <OnboardingGuard>
          <KeuanganPage />
        </OnboardingGuard>
      </SubscriptionGuard>
    ),
  },
  {
    path: "/profil",
    element: (
      <SubscriptionGuard>
        <OnboardingGuard>
          <ProfilPage />
        </OnboardingGuard>
      </SubscriptionGuard>
    ),
  },
];
