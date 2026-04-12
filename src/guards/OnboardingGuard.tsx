import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";

interface OnboardingGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

/**
 * Guard that requires user to have at least one property
 * Redirects to onboarding if user has no properties
 */
export function OnboardingGuard({
  children,
  fallbackPath = "/onboarding",
}: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading: propLoading } = useProperty();
  const { isDemo } = useDemo();

  if (authLoading || propLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Demo mode bypasses property requirement
  if (isDemo) {
    return children;
  }

  // User must be authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User must have at least one property
  if (properties.length === 0) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
