import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import AdminLayout from "./AdminLayout";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CalendarPlus, Ban, Trash2, ArrowLeftRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  nama: string | null;
  no_hp: string | null;
  property_count?: number;
  room_count?: number;
  sub_status?: string;
  sub_plan?: string;
  sub_expires?: string;
  property_name?: string;
}

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("Semua");
  const [page, setPage] = useState(0);
  const [showExtend, setShowExtend] = useState<UserRow | null>(null);
  const [extendMonths, setExtendMonths] = useState("1");
  const [saving, setSaving] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, statsRes, subsRes, propsRes] = await Promise.all([
      supabase.rpc("admin_get_users") as any,
      supabase.rpc("admin_get_user_stats") as any,
      supabase.from("subscriptions").select("*") as any,
      supabase.from("properties").select("id, user_id, nama_kos") as any,
    ]);

    const allUsers = (usersRes.data || []) as UserRow[];
    const statsMap: Record<string, { property_count: number; room_count: number }> = {};
    ((statsRes.data || []) as any[]).forEach((s: any) => {
      statsMap[s.user_id] = { property_count: Number(s.property_count), room_count: Number(s.room_count) };
    });
    const subMap: Record<string, { status: string; plan: string; expires_at: string }> = {};
    ((subsRes.data || []) as any[]).forEach((s: any) => {
      subMap[s.user_id] = { status: s.status, plan: s.plan, expires_at: s.expires_at };
    });
    const propMap: Record<string, string> = {};
    ((propsRes.data || []) as any[]).forEach((p: any) => {
      propMap[p.user_id] = p.nama_kos;
    });

    const merged = allUsers.map(u => ({
      ...u,
      property_count: statsMap[u.id]?.property_count || 0,
      room_count: statsMap[u.id]?.room_count || 0,
      sub_status: subMap[u.id]?.status || "none",
      sub_plan: subMap[u.id]?.plan || "-",
      sub_expires: subMap[u.id]?.expires_at || null,
      property_name: propMap[u.id] || "-",
    }));

    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.nama?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterPlan === "Semua" ||
      (filterPlan === "Mandiri" && u.sub_plan === "mandiri") ||
      (filterPlan === "Juragan" && u.sub_plan === "juragan") ||
      (filterPlan === "Belum" && u.sub_status === "none");
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleExtend = async () => {
    if (!showExtend) return;
    setSaving(true);
    const months = parseInt(extendMonths) || 1;
    const now = new Date();
    let startDate = now;
    if (showExtend.sub_expires) {
      const existing = new Date(showExtend.sub_expires);
      if (existing > now) startDate = existing;
    }
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    if (showExtend.sub_status !== "none") {
      await supabase.from("subscriptions")
        .update({ status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any)
        .eq("user_id", showExtend.id);
    } else {
      await supabase.from("subscriptions")
        .insert({ user_id: showExtend.id, plan: "mandiri", status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any);
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

  const handleActivate = async (userId: string) => {
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const existing = users.find(u => u.id === userId);
    if (existing?.sub_status === "none") {
      await supabase.from("subscriptions")
        .insert({ user_id: userId, plan: "mandiri", status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any);
    } else {
      await supabase.from("subscriptions")
        .update({ status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any)
        .eq("user_id", userId);
    }
    toast.success("Subscription diaktifkan");
    fetchData();
  };

  const handleSwitchPlan = async (userId: string, currentPlan: string) => {
    const newPlan = currentPlan === "mandiri" ? "juragan" : "mandiri";
    await supabase.from("subscriptions")
      .update({ plan: newPlan } as any)
      .eq("user_id", userId);
    toast.success(`Paket diubah ke ${newPlan}`);
    fetchData();
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    // Delete user data (subscriptions, properties cascade will handle rooms/tenants etc.)
    await supabase.from("subscriptions").delete().eq("user_id", deleteUser.id);
    await supabase.from("profiles").delete().eq("id", deleteUser.id);
    toast.success("Data user dihapus");
    setDeleteUser(null);
    fetchData();
  };

  const statusBadge = (status?: string, plan?: string) => {
    if (status === "aktif") return (
      <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] text-[10px] font-bold uppercase">
        {plan || "aktif"}
      </span>
    );
    if (status === "expired") return <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold">EXPIRED</span>;
    return <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">BELUM</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">User Management</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Cari nama atau email..." className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {["Semua", "Mandiri", "Juragan", "Belum"].map(tab => (
              <button key={tab} onClick={() => { setFilterPlan(tab); setPage(0); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterPlan === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >{tab}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada user</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">No HP</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Paket</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Nama Kos</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Kamar</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Daftar</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{u.nama || "-"}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3 text-muted-foreground">{u.no_hp || "-"}</td>
                      <td className="p-3">{statusBadge(u.sub_status, u.sub_plan)}</td>
                      <td className="p-3 text-muted-foreground">{u.property_name}</td>
                      <td className="p-3 text-muted-foreground">{u.room_count}</td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("id-ID")}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          {u.sub_status === "aktif" ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDeactivate(u.id)}>
                              <Ban size={12} className="mr-1" /> Off
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-[hsl(var(--success))]" onClick={() => handleActivate(u.id)}>
                              Aktifkan
                            </Button>
                          )}
                          {u.sub_status !== "none" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleSwitchPlan(u.id, u.sub_plan || "mandiri")}>
                              <ArrowLeftRight size={12} className="mr-1" /> Switch
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowExtend(u); setExtendMonths("1"); }}>
                            <CalendarPlus size={12} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteUser(u)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {paginated.map(u => (
                <div key={u.id} className="bg-card rounded-xl border border-border p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.nama || u.email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{u.property_name}</span>
                        <span>{u.room_count} kamar</span>
                        <span>{new Date(u.created_at).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {statusBadge(u.sub_status, u.sub_plan)}
                      {u.sub_expires && <span className="text-[10px] text-muted-foreground">s/d {u.sub_expires}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {u.sub_status === "aktif" ? (
                      <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30" onClick={() => handleDeactivate(u.id)}>
                        <Ban size={12} className="mr-1" /> Off
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleActivate(u.id)}>
                        Aktifkan
                      </Button>
                    )}
                    {u.sub_status !== "none" && (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleSwitchPlan(u.id, u.sub_plan || "mandiri")}>
                        <ArrowLeftRight size={12} className="mr-1" /> Switch
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setShowExtend(u); setExtendMonths("1"); }}>
                      <CalendarPlus size={12} className="mr-1" /> Extend
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30" onClick={() => setDeleteUser(u)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
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

      <DeleteConfirmDialog
        open={!!deleteUser}
        onOpenChange={open => !open && setDeleteUser(null)}
        title={`Hapus data ${deleteUser?.nama || deleteUser?.email}?`}
        description="Subscription dan profil user akan dihapus. Data ini tidak dapat dikembalikan."
        onConfirm={handleDeleteUser}
      />
    </AdminLayout>
  );
}
