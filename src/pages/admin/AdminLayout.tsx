import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, Users, Megaphone, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const tabs = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    const check = async () => {
      const { data } = await supabase.rpc("is_admin") as any;
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
    };
    check();
  }, [user, authLoading]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-card sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-border bg-card">
          {tabs.map(tab => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === tab.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}