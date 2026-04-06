import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import AdminLayout from "./AdminLayout";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CalendarPlus, Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  nama: string | null;
  no_hp: string | null;
  property_count?: number;
  room_count?: number;
  sub_status?: string;
  sub_expires?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [showExtend, setShowExtend] = useState<UserRow | null>(null);
  const [extendMonths, setExtendMonths] = useState("1");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, statsRes, subsRes] = await Promise.all([
      supabase.rpc("admin_get_users") as any,
      supabase.rpc("admin_get_user_stats") as any,
      supabase.from("subscriptions").select("*") as any,
    ]);

    const allUsers = (usersRes.data || []) as UserRow[];
    const statsMap: Record<string, { property_count: number; room_count: number }> = {};
    ((statsRes.data || []) as any[]).forEach((s: any) => {
      statsMap[s.user_id] = { property_count: Number(s.property_count), room_count: Number(s.room_count) };
    });
    const subMap: Record<string, { status: string; expires_at: string }> = {};
    ((subsRes.data || []) as any[]).forEach((s: any) => {
      subMap[s.user_id] = { status: s.status, expires_at: s.expires_at };
    });

    const merged = allUsers.map(u => ({
      ...u,
      property_count: statsMap[u.id]?.property_count || 0,
      room_count: statsMap[u.id]?.room_count || 0,
      sub_status: subMap[u.id]?.status || "none",
      sub_expires: subMap[u.id]?.expires_at || null,
    }));

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.nama?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === "Semua" ||
      (filterStatus === "Aktif" && u.sub_status === "aktif") ||
      (filterStatus === "Expired" && u.sub_status === "expired") ||
      (filterStatus === "Belum" && u.sub_status === "none");
    return matchSearch && matchFilter;
  });

  const handleExtend = async () => {
    if (!showExtend) return;
    setSaving(true);
    const months = parseInt(extendMonths) || 1;
    const now = new Date();
    const existingSub = users.find(u => u.id === showExtend.id);
    let startDate = now;
    if (existingSub?.sub_expires) {
      const existing = new Date(existingSub.sub_expires);
      if (existing > now) startDate = existing;
    }
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    if (existingSub?.sub_status !== "none") {
      await supabase.from("subscriptions")
        .update({ status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any)
        .eq("user_id", showExtend.id);
    } else {
      await supabase.from("subscriptions")
        .insert({ user_id: showExtend.id, status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any);
    }
    toast.success(`Subscription diperpanjang ${months} bulan`);
    setSaving(false);
    setShowExtend(null);
    fetchData();
  };

  const handleDeactivate = async (userId: string) => {
    await supabase.from("subscriptions")
      .update({ status: "expired" } as any)
      .eq("user_id", userId);
    toast.success("Subscription dinonaktifkan");
    fetchData();
  };

  const statusLabel = (s?: string) => {
    if (s === "aktif") return <span className="px-2 py-0.5 rounded-full bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)] text-[10px] font-bold">AKTIF</span>;
    if (s === "expired") return <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold">EXPIRED</span>;
    return <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">BELUM</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..." className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["Semua", "Aktif", "Expired", "Belum"].map(tab => (
            <button key={tab} onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >{tab}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada user</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="bg-card rounded-xl border border-border p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.nama || u.email.split("@")[0]}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{u.property_count} properti</span>
                      <span>{u.room_count} kamar</span>
                      <span>{new Date(u.created_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {statusLabel(u.sub_status)}
                    {u.sub_expires && (
                      <span className="text-[10px] text-muted-foreground">s/d {u.sub_expires}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => { setShowExtend(u); setExtendMonths("1"); }}>
                    <CalendarPlus size={12} className="mr-1" /> Extend
                  </Button>
                  {u.sub_status === "aktif" && (
                    <Button size="sm" variant="outline" className="text-xs h-8 text-destructive border-destructive/30" onClick={() => handleDeactivate(u.id)}>
                      <Ban size={12} className="mr-1" /> Deactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={!!showExtend} onClose={() => setShowExtend(null)} title="Extend Subscription">
        {showExtend && (
          <div className="bottom-sheet-form">
            <div className="bottom-sheet-body">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{showExtend.nama || showExtend.email}</p>
                <p className="text-xs text-muted-foreground">{showExtend.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Tambah Bulan</Label>
                <div className="flex gap-2">
                  {[1, 3, 6, 12].map(m => (
                    <button key={m} onClick={() => setExtendMonths(String(m))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        extendMonths === String(m)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >{m} bln</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bottom-sheet-footer">
              <Button className="w-full" onClick={handleExtend} disabled={saving}>
                {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : "Simpan Subscription"}
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </AdminLayout>
  );
}