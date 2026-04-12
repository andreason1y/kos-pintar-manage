import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";

interface AuthGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

/**
 * Guard that requires authentication
 * Redirects to login if not authenticated (unless in demo mode)
 */
export function AuthGuard({ children, fallbackPath = "/" }: AuthGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { isDemo } = useDemo();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Demo mode bypasses auth
  if (isDemo) {
    return children;
  }

  // Require authentication
  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
