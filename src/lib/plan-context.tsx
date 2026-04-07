import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";

export type PlanType = "mandiri" | "juragan" | "demo";

export interface PlanLimits {
  maxRooms: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  mandiri: { maxRooms: 40 },
  juragan: { maxRooms: 200 },
  demo: { maxRooms: 200 },
};

export const PLAN_LABELS: Record<PlanType, string> = {
  mandiri: "Mandiri",
  juragan: "Juragan",
  demo: "Juragan",
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
  plan: "mandiri",
  limits: PLAN_LIMITS.mandiri,
  planLabel: "Mandiri",
  loading: true,
  showUpgradeModal: false,
  upgradeMessage: "",
  upgradeCta: "Upgrade ke Juragan →",
  upgradeLink: "",
  triggerUpgrade: () => {},
  dismissUpgrade: () => {},
});

export const usePlan = () => useContext(PlanContext);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isDemo } = useDemo();
  const [plan, setPlan] = useState<PlanType>("mandiri");
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [upgradeCta, setUpgradeCta] = useState("Upgrade ke Juragan →");
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
          setPlan((data[0] as any).plan || "mandiri");
        } else {
          setPlan("mandiri");
        }
        setLoading(false);
      });
  }, [user, isDemo]);

  const triggerUpgrade = useCallback((message: string, cta?: string, link?: string) => {
    setUpgradeMessage(message);
    setUpgradeCta(cta || "Upgrade ke Juragan →");
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
