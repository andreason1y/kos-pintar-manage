import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PropertyProvider, useProperty } from "@/lib/property-context";
import { DemoProvider, useDemo } from "@/lib/demo-context";
import { PlanProvider } from "@/lib/plan-context";
import UpgradeModal from "@/components/UpgradeModal";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const KamarPage = lazy(() => import("./pages/KamarPage"));
const PenyewaPage = lazy(() => import("./pages/PenyewaPage"));
const PembayaranPage = lazy(() => import("./pages/PembayaranPage"));
const KeuanganPage = lazy(() => import("./pages/KeuanganPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBroadcast = lazy(() => import("./pages/admin/AdminBroadcast"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function MainRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/beranda" element={<DashboardPage />} />
        <Route path="/kamar" element={<KamarPage />} />
        <Route path="/penyewa" element={<PenyewaPage />} />
        <Route path="/pembayaran" element={<PembayaranPage />} />
        <Route path="/keuangan" element={<KeuanganPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/broadcast" element={<AdminBroadcast />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        {/* Redirect old / and /login to /beranda for logged in users */}
        <Route path="/" element={<Navigate to="/beranda" replace />} />
        <Route path="/login" element={<Navigate to="/beranda" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading: propLoading } = useProperty();
  const { isDemo } = useDemo();

  // Demo mode - skip auth entirely
  if (isDemo) return <MainRoutes />;

  if (authLoading || (user && propLoading)) return <LoadingScreen />;

  // Not authenticated: show landing page or login
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (properties.length === 0) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="*" element={<OnboardingPage />} />
        </Routes>
      </Suspense>
    );
  }

  return <MainRoutes />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DemoProvider>
          <AuthProvider>
            <PropertyProvider>
              <PlanProvider>
                <AppRoutes />
                <UpgradeModal />
              </PlanProvider>
            </PropertyProvider>
          </AuthProvider>
        </DemoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
