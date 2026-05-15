import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import { Users, CreditCard, TrendingUp, UserPlus, Ticket, Home, BarChart3, AlertTriangle } from "lucide-react";
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

interface StatRow {
  user_id: string;
  property_count: number;
  room_count: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [topUsers, setTopUsers] = useState<{ user_id: string; count: number; nama?: string; email?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  useEffect(() => {
    const load = async () => {
      const [usersRes, subsRes, settingsRes, statsRes] = await Promise.all([
        supabase.rpc("admin_get_users"),
        supabase.from("subscriptions").select("*"),
        supabase.from("settings").select("*"),
        supabase.rpc("admin_get_user_stats"),
      ]);
      const usersData = (usersRes.data || []) as UserRow[];
      const subsData = (subsRes.data || []) as SubRow[];
      const statsData = (statsRes.data || []) as StatRow[];
      setUsers(usersData);
      setSubs(subsData);
      setStats(statsData);

      const s: Record<string, number> = {};
      (settingsRes.data || []).forEach(r => {
        const row = r as { key: string; value: number };
        s[row.key] = row.value;
      });
      setSettings(s);

      // Top 5 users by transaction count — fetch transactions grouped
      const { data: txData } = await supabase.from("transactions").select("tenant_id, property_id");
      if (txData) {
        const countByUser: Record<string, number> = {};
        // We need to map property_id -> user_id
        const { data: propsData } = await supabase.from("properties").select("id, user_id");
        const propToUser: Record<string, string> = {};
        (propsData || []).forEach(p => { propToUser[p.id] = p.user_id; });
        txData.forEach(tx => {
          const uid = propToUser[tx.property_id];
          if (uid) countByUser[uid] = (countByUser[uid] || 0) + 1;
        });
        const sorted = Object.entries(countByUser)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([user_id, count]) => {
            const u = usersData.find(u => u.id === user_id);
            return { user_id, count, nama: u?.nama || undefined, email: u?.email };
          });
        setTopUsers(sorted);
      }

      setLoading(false);
    };
    load();
  }, []);

  const activeSubs = subs.filter(s => s.status === "aktif");
  const miniCount    = activeSubs.filter(s => s.plan === "mini").length;
  const starterCount = activeSubs.filter(s => s.plan === "starter").length;
  const proCount     = activeSubs.filter(s => s.plan === "pro").length;

  const priceMini    = 149000;
  const priceStarter = 249000;
  const pricePro     = 499000;
  const revenue = miniCount * priceMini + starterCount * priceStarter + proCount * pricePro;

  const newThisMonth = users.filter(u => {
    const d = new Date(u.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalSlots = settings.earlybird_slots_total || 100;
  const slotsTaken = settings.early_bird_slots_taken || 0;
  const slotsRemaining = Math.max(0, totalSlots - slotsTaken - users.length);

  const totalRooms = stats.reduce((sum, s) => sum + (s.room_count || 0), 0);
  const avgRoomsPerUser = users.length > 0 ? (totalRooms / users.length).toFixed(1) : "0";

  // Expiring in 7 days
  const now7 = new Date();
  now7.setDate(now7.getDate() + 7);
  const expiringSoon = subs
    .filter(s => s.status === "aktif" && new Date(s.expires_at) <= now7 && new Date(s.expires_at) >= new Date())
    .map(s => {
      const u = users.find(u => u.id === s.user_id);
      return { ...s, nama: u?.nama, email: u?.email };
    });

  const statCards = [
    { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
    { label: "Active Subs", value: `${activeSubs.length} (M:${miniCount} S:${starterCount} P:${proCount})`, icon: CreditCard, color: "text-[hsl(var(--success))]" },
    { label: "Est. Revenue", value: formatRupiah(revenue), icon: TrendingUp, color: "text-primary" },
    { label: "New This Month", value: newThisMonth.length, icon: UserPlus, color: "text-accent" },
    { label: "Early Bird Left", value: slotsRemaining, icon: Ticket, color: "text-[hsl(var(--warning))]" },
    { label: "Total Kamar", value: totalRooms, icon: Home, color: "text-primary" },
    { label: "Avg Kamar/User", value: avgRoomsPerUser, icon: BarChart3, color: "text-accent" },
  ];

  const recentSignups = [...users].slice(0, 8);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((s, i) => (
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

          {/* Expiring Soon */}
          {expiringSoon.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[hsl(var(--warning))]" />
                Expiring in 7 Days ({expiringSoon.length})
              </h3>
              <div className="space-y-2">
                {expiringSoon.map(s => (
                  <div key={s.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.nama || s.email?.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <span className="text-xs text-destructive font-semibold">
                      {new Date(s.expires_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 5 Active Users */}
          {topUsers.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3">🏆 Top 5 Users (by transactions)</h3>
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div key={u.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.nama || u.email?.split("@")[0]}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary">{u.count} txn</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Signups */}
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
