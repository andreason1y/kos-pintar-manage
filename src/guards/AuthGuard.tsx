import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";

interface AuthGuardProps {
  children: ReactNode;
  fallbackPath?: string;
}

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

  if (isDemo) {
    return children;
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Blokir akses jika OTP belum diverifikasi untuk sesi ini
  // (redirect ke login → AuthPage akan otomatis tampilkan step OTP)
  const otpVerified = sessionStorage.getItem("otp_verified") === user.id;
  if (!otpVerified) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
