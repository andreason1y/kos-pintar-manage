import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";
import { supabase } from "@/integrations/supabase/client";

interface AdminGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

/**
 * Guard that requires admin role
 * Checks user's role in public.users table
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
    return data?.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Client-side Admin Guard component
 * Note: This is a UI-level guard; RLS policies handle server-side security
 */
export function AdminGuard({
  children,
  fallbackPath = "/beranda",
}: AdminGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { isDemo } = useDemo();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Demo mode allows admin access
  if (isDemo) {
    return children;
  }

  // This is a basic guard - actual role check happens via Supabase RLS
  // For proper admin verification, queries should fail at the RLS level if not admin
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
