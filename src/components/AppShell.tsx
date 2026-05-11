import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "./BottomNav";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useDemo } from "@/lib/demo-context";
import logoIcon from "@/assets/logo-icon.png";
import { X } from "lucide-react";

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isDemo } = useDemo();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [inAppAnnouncement, setInAppAnnouncement] = useState("");
  const [inAppAnnouncementActive, setInAppAnnouncementActive] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    supabase.from("settings").select("key, value").then(({ data }) => {
      const map: Record<string, number> = {};
      (data || []).forEach(r => { map[r.key] = r.value; });
      if (map.maintenance_mode === 1) setMaintenanceMode(true);
      if (map.in_app_announcement_active === 1) setInAppAnnouncementActive(true);
    });
    supabase.from("settings_text").select("key, value").then(({ data }) => {
      const map: Record<string, string> = {};
      (data || []).forEach(r => { map[r.key] = r.value; });
      if (map.in_app_announcement_text) setInAppAnnouncement(map.in_app_announcement_text);
    });
  }, []);

  useEffect(() => {
    if (user && !isDemo) {
      supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", user.id).then(() => {});
    }
  }, [user?.id]);

  if (maintenanceMode && !isDemo && user?.email !== "andreassina9a@gmail.com") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <img src={logoIcon} alt="KosPintar" className="h-12 w-12 rounded-xl mb-5" />
        <h1 className="text-lg font-bold text-foreground mb-2">Sedang dalam Pemeliharaan</h1>
        <p className="text-sm text-muted-foreground max-w-md">Kami sedang melakukan pemeliharaan sistem. Silakan kembali lagi nanti.</p>
      </div>
    );
  }

  const announcementBanner = inAppAnnouncementActive && inAppAnnouncement && !bannerDismissed && (
    <div className="bg-muted border-b border-border/60 px-4 py-2 flex items-center gap-2">
      <p className="flex-1 text-xs font-medium text-foreground">{inAppAnnouncement}</p>
      <button onClick={() => setBannerDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors">
        <X size={14} />
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {announcementBanner}
        <div className="mx-auto max-w-app pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {announcementBanner}
          <div className="mx-auto max-w-4xl p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
