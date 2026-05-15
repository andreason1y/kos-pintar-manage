import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";
import { toast } from "sonner";

export type PlanType = "mini" | "starter" | "pro" | "demo";

export interface PlanLimits {
  maxRooms: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  mini:    { maxRooms: 10 },
  starter: { maxRooms: 25 },
  pro:     { maxRooms: 60 },
  demo:    { maxRooms: 60 },
};

export const PLAN_LABELS: Record<PlanType, string> = {
  mini:    "Mini",
  starter: "Starter",
  pro:     "Pro",
  demo:    "Pro",
};

interface PlanContextType {
  plan: PlanType;
  limits: PlanLimits;
  planLabel: string;
  loading: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  durationMonths: number | null;
  showUpgradeModal: boolean;
  upgradeMessage: string;
  upgradeCta: string;
  upgradeLink: string;
  triggerUpgrade: (message: string, cta?: string, link?: string) => void;
  dismissUpgrade: () => void;
}

const PlanContext = createContext<PlanContextType>({
  plan: "mini",
  limits: PLAN_LIMITS.mini,
  planLabel: "Mini",
  loading: true,
  expiresAt: null,
  isExpired: false,
  durationMonths: null,
  showUpgradeModal: false,
  upgradeMessage: "",
  upgradeCta: "Upgrade rencana Anda →",
  upgradeLink: "",
  triggerUpgrade: () => {},
  dismissUpgrade: () => {},
});

export const usePlan = () => useContext(PlanContext);

// Migration: map old plan names to current ones
function migratePlanType(oldPlan: string): PlanType {
  const planMap: Record<string, PlanType> = {
    mandiri: "mini",    // legacy pre-2026
    juragan: "starter", // legacy pre-2026
    bisnis:  "pro",     // safety fallback if any bisnis remains post-migration
    mini:    "mini",
    starter: "starter",
    pro:     "pro",
    demo:    "demo",
  };
  return planMap[oldPlan] ?? "mini";
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [plan, setPlan] = useState<PlanType>("mini");
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [durationMonths, setDurationMonths] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [upgradeCta, setUpgradeCta] = useState("Upgrade rencana Anda →");
  const [upgradeLink, setUpgradeLink] = useState("");

  useEffect(() => {
    if (isDemo) {
      setPlan("demo");
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("subscriptions")
      .select("plan, expires_at, duration_months")
      .eq("user_id", user.id)
      .eq("status", "aktif")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.warn("[PlanContext] Failed to fetch subscription:", error.message);
          toast.warning("Gagal memuat status langganan. Beberapa fitur mungkin terbatas.");
          setPlan("mini");
          setExpiresAt(null);
          setDurationMonths(null);
          setLoading(false);
          return;
        }
        if (data && data.length > 0) {
          const sub = data[0] as { plan: string; expires_at: string | null; duration_months: number | null };
          setPlan(migratePlanType(sub.plan || "mini"));
          setExpiresAt(sub.expires_at || null);
          setDurationMonths(sub.duration_months ?? null);
        } else {
          setPlan("mini");
          setExpiresAt(null);
          setDurationMonths(null);
        }
        setLoading(false);
      });
  }, [user, isDemo]);

  const triggerUpgrade = useCallback((message: string, cta?: string, link?: string) => {
    setUpgradeMessage(message);
    setUpgradeCta(cta || "Upgrade rencana Anda →");
    setUpgradeLink(link || "");
    setShowUpgradeModal(true);
  }, []);

  const dismissUpgrade = useCallback(() => {
    setShowUpgradeModal(false);
    setUpgradeMessage("");
  }, []);

  const limits = PLAN_LIMITS[plan];
  const planLabel = PLAN_LABELS[plan];
  const isExpired = expiresAt !== null && new Date(expiresAt) < new Date();

  return (
    <PlanContext.Provider value={{
      plan, limits, planLabel, loading,
      expiresAt, isExpired, durationMonths,
      showUpgradeModal, upgradeMessage, upgradeCta, upgradeLink,
      triggerUpgrade, dismissUpgrade,
    }}>
      {children}
    </PlanContext.Provider>
  );
}
