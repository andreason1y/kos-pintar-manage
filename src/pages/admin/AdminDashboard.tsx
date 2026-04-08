import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import { Users, CreditCard, TrendingUp, UserPlus, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "./AdminLayout";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  nama: string | null;
  no_hp: string | null;
}

interface SubRow {
  user_id: string;
  plan: string;
  status: string;
  expires_at: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  useEffect(() => {
    const load = async () => {
      const [usersRes, subsRes, settingsRes] = await Promise.all([
        supabase.rpc("admin_get_users") as any,
        supabase.from("subscriptions").select("*") as any,
        supabase.from("settings").select("*") as any,
      ]);
      setUsers((usersRes.data || []) as UserRow[]);
      setSubs((subsRes.data || []) as SubRow[]);
      const s: Record<string, number> = {};
      ((settingsRes.data || []) as any[]).forEach((r: any) => { s[r.key] = r.value; });
      setSettings(s);
      setLoading(false);
    };
    load();
  }, []);

  const activeSubs = subs.filter(s => s.status === "aktif");
  const mandiriCount = activeSubs.filter(s => s.plan === "mandiri").length;
  const juraganCount = activeSubs.filter(s => s.plan === "juragan").length;

  const priceMandiri = settings.price_mandiri_early || 249000;
  const priceJuragan = settings.price_juragan_early || 499000;
  const revenue = mandiriCount * priceMandiri + juraganCount * priceJuragan;

  const newThisMonth = users.filter(u => {
    const d = new Date(u.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalSlots = settings.early_bird_total_slots || 100;
  const slotsTaken = settings.early_bird_slots_taken || 0;
  const slotsRemaining = Math.max(0, totalSlots - slotsTaken - users.length);

  const recentSignups = [...users].slice(0, 8);

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
    { label: "Active Subs", value: `${activeSubs.length} (M:${mandiriCount} J:${juraganCount})`, icon: CreditCard, color: "text-[hsl(var(--success))]" },
    { label: "Est. Revenue", value: formatRupiah(revenue), icon: TrendingUp, color: "text-primary" },
    { label: "New This Month", value: newThisMonth.length, icon: UserPlus, color: "text-accent" },
    { label: "Early Bird Slots Left", value: slotsRemaining, icon: Ticket, color: "text-[hsl(var(--warning))]" },
  ];

  return (
    <AdminLayout>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon size={18} className={s.color} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Signups</h3>
            <div className="space-y-2">
              {recentSignups.map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.nama || u.email.split("@")[0]}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
