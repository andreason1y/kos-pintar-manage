import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePlan } from "@/lib/plan-context";
import { useDemo } from "@/lib/demo-context";
import { useAuth } from "@/lib/auth-context";

export default function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { expiresAt, isExpired, loading } = usePlan();
  const { isDemo } = useDemo();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isDemo || !user) return <>{children}</>;

  if (expiresAt === null || isExpired) {
    return <Navigate to="/pilih-paket" replace />;
  }

  return <>{children}</>;
}
