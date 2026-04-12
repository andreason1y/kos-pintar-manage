import { lazy, Suspense } from "react";
import { useRoutes, Navigate, RouteObject } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { publicRoutes } from "@/routes/public.routes";
import { privateRoutes } from "@/routes/private.routes";
import { adminRoutes } from "@/routes/admin.routes";

const NotFound = lazy(() => import("@/pages/NotFound"));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Main router component
 * Routes are dynamically loaded based on auth state and demo mode
 * Pattern: Public → Private (Onboarding) → Private (With Property) → Admin
 */
export function Router() {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading: propLoading } = useProperty();
  const { isDemo } = useDemo();

  // Show loading while auth AND properties are being resolved
  // This ensures we never route based on incomplete state
  if (authLoading || propLoading) {
    return <LoadingScreen />;
  }

  let routes: RouteObject[] = [];

  // Demo mode - all routes available
  if (isDemo) {
    routes = [
      ...privateRoutes,
      ...adminRoutes,
      ...publicRoutes,
      { path: "*", element: <Navigate to="/beranda" replace /> },
    ];
  }
  // Not authenticated - only public routes
  else if (!user) {
    routes = [
      ...publicRoutes,
      { path: "*", element: <Navigate to="/" replace /> },
    ];
  }
  // Authenticated - public + private + admin routes
  else {
    routes = [
      ...publicRoutes,
      ...privateRoutes,
      ...adminRoutes,
      {
        path: "*",
        element: <Navigate to={properties.length > 0 ? "/beranda" : "/onboarding"} replace />,
      },
    ];
  }

  const element = useRoutes(routes);

  return (
    <Suspense fallback={<LoadingScreen />}>
      {element}
    </Suspense>
  );
}
