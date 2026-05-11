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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      backgroundColor: "#ffffff",
    }}>
      <div style={{
        width: "2rem",
        height: "2rem",
        border: "2px solid #171717",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
      <p style={{
        fontSize: "0.875rem",
        color: "#6b7280",
        margin: 0,
      }}>Memuat...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

  // Build routes based on auth state - must be before useRoutes hook
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

  // Call useRoutes before any early returns
  const element = useRoutes(routes);

  // Show loading while auth AND properties are being resolved
  // This ensures we never route based on incomplete state
  if (authLoading || propLoading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      {element}
    </Suspense>
  );
}
