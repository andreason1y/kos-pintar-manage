import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import { Users, Building2, TrendingUp, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import AdminLayout from "./AdminLayout";

const SUBSCRIPTION_PRICE = 49000; // Rp/bulan

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  nama: string | null;
  no_hp: string | null;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [subCount, setSubCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  useEffect(() => {
    const fetch = async () => {
      const { data: userData } = await supabase.rpc("admin_get_users") as any;
      const allUsers = (userData || []) as UserRow[];
      setUsers(allUsers);

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("status", "aktif") as any;
      setSubCount((subData || []).length);

      setLoading(false);
    };
    fetch();
  }, []);

  const newThisMonth = users.filter(u => {
    const d = new Date(u.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const revenue = subCount * SUBSCRIPTION_PRICE;

  const recentSignups = [...users].slice(0, 10);

  return (
    <AdminLayout>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-primary" />
                <span className="text-xs text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} className="text-[hsl(142,71%,45%)]" />
                <span className="text-xs text-muted-foreground">Active Subs</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{subCount}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={18} className="text-accent" />
                <span className="text-xs text-muted-foreground">New This Month</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{newThisMonth.length}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-primary" />
                <span className="text-xs text-muted-foreground">Est. Revenue</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatRupiah(revenue)}</p>
            </motion.div>
          </div>

          {/* Recent signups */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent Signups</h2>
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