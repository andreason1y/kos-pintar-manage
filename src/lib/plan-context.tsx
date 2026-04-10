import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";

export type PlanType = "starter" | "pro" | "bisnis" | "demo";

export interface PlanLimits {
  maxRooms: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  starter: { maxRooms: 10 },
  pro: { maxRooms: 25 },
  bisnis: { maxRooms: 60 },
  demo: { maxRooms: 200 },
};

export const PLAN_LABELS: Record<PlanType, string> = {
  starter: "Starter",
  pro: "Pro",
  bisnis: "Bisnis",
  demo: "Bisnis",
};

interface PlanContextType {
  plan: PlanType;
  limits: PlanLimits;
  planLabel: string;
  loading: boolean;
  showUpgradeModal: boolean;
  upgradeMessage: string;
  upgradeCta: string;
  upgradeLink: string;
  triggerUpgrade: (message: string, cta?: string, link?: string) => void;
  dismissUpgrade: () => void;
}

const PlanContext = createContext<PlanContextType>({
  plan: "starter",
  limits: PLAN_LIMITS.starter,
  planLabel: "Starter",
  loading: true,
  showUpgradeModal: false,
  upgradeMessage: "",
  upgradeCta: "Upgrade rencana Anda →",
  upgradeLink: "",
  triggerUpgrade: () => {},
  dismissUpgrade: () => {},
});

export const usePlan = () => useContext(PlanContext);

// Migration: Map old plan names to new ones
function migratePlanType(oldPlan: string): PlanType {
  const planMap: Record<string, PlanType> = {
    mandiri: "starter",
    juragan: "pro",
    starter: "starter",
    pro: "pro",
    bisnis: "bisnis",
    demo: "demo",
  };
  return (planMap[oldPlan] || "starter") as PlanType;
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [plan, setPlan] = useState<PlanType>("starter");
  const [loading, setLoading] = useState(true);
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
      .select("plan")
      .eq("user_id", user.id)
      .eq("status", "aktif")
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const loadedPlan = (data[0] as any).plan || "starter";
          setPlan(migratePlanType(loadedPlan));
        } else {
          setPlan("starter");
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

  return (
    <PlanContext.Provider value={{ plan, limits, planLabel, loading, showUpgradeModal, upgradeMessage, upgradeCta, upgradeLink, triggerUpgrade, dismissUpgrade }}>
      {children}
    </PlanContext.Provider>
  );
}
