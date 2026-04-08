import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard, Users, Settings, CreditCard, Megaphone,
  ArrowLeft, Loader2, Menu, X, ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const ADMIN_EMAIL = "andreassina9a@gmail.com";

const tabs = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { path: "/admin/settings", label: "Settings", icon: Settings },
  { path: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { path: "/admin/activity-log", label: "Activity Log", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/");
      return;
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const SidebarContent = () => (
    <nav className="flex flex-col gap-1 p-3">
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => { navigate(tab.path); setSidebarOpen(false); }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-56 border-r border-border bg-card flex flex-col shrink-0 sticky top-0 h-screen">
          <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">KP</span>
            </div>
            <span className="text-sm font-bold text-foreground">KosPintar Admin</span>
          </div>
          <SidebarContent />
          <div className="mt-auto p-3 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground" onClick={() => navigate("/beranda")}>
              <ArrowLeft size={14} className="mr-2" /> Kembali ke App
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile overlay sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-card border-r border-border flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">KP</span>
                </div>
                <span className="text-sm font-bold text-foreground">KosPintar Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground">
                <X size={20} />
              </button>
            </div>
            <SidebarContent />
            <div className="mt-auto p-3 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground" onClick={() => navigate("/beranda")}>
                <ArrowLeft size={14} className="mr-2" /> Kembali ke App
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-20">
            <button onClick={() => setSidebarOpen(true)} className="text-foreground">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold">KP</span>
              </div>
              <span className="text-sm font-bold text-foreground">KosPintar Admin</span>
            </div>
          </div>
        )}
        <div className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
