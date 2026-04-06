import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { PropertyProvider, useProperty } from "@/lib/property-context";
import { DemoProvider, useDemo } from "@/lib/demo-context";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const KamarPage = lazy(() => import("./pages/KamarPage"));
const PenyewaPage = lazy(() => import("./pages/PenyewaPage"));
const PembayaranPage = lazy(() => import("./pages/PembayaranPage"));
const KeuanganPage = lazy(() => import("./pages/KeuanganPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/kamar" element={<KamarPage />} />
        <Route path="/penyewa" element={<PenyewaPage />} />
        <Route path="/pembayaran" element={<PembayaranPage />} />
        <Route path="/keuangan" element={<KeuanganPage />} />
        <Route path="/profil" element={<ProfilPage />} />
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
  if (!user) return <AuthPage />;
  if (properties.length === 0) return <OnboardingPage />;

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
              <AppRoutes />
            </PropertyProvider>
          </AuthProvider>
        </DemoProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
