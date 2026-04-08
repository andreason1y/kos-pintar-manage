import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import AdminLayout from "./AdminLayout";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, CalendarPlus, Ban, Trash2, ArrowLeftRight, Loader2,
  ChevronLeft, ChevronRight, Plus, Key, Edit, ChevronDown, ChevronUp,
  Download, Users, Mail,
} from "lucide-react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
  sub_started?: string;
  property_name?: string;
  last_login?: string;
}

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("Semua");
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add user modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    nama: "", email: "", no_hp: "", password: "", plan: "mandiri",
    nama_kos: "", started_at: new Date().toISOString().split("T")[0],
    expires_at: "",
  });

  // Edit user modal
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    nama: "", no_hp: "", nama_kos: "", plan: "mandiri", status: "aktif", expires_at: "",
  });

  // Reset password modal
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetMode, setResetMode] = useState<"email" | "manual">("email");
  const [newPassword, setNewPassword] = useState("");

  // Extend modal
  const [showExtend, setShowExtend] = useState<UserRow | null>(null);
  const [extendMonths, setExtendMonths] = useState("1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, statsRes, subsRes, propsRes, profilesRes] = await Promise.all([
      supabase.rpc("admin_get_users") as any,
      supabase.rpc("admin_get_user_stats") as any,
      supabase.from("subscriptions").select("*") as any,
      supabase.from("properties").select("id, user_id, nama_kos") as any,
      supabase.from("profiles").select("id, last_login") as any,
    ]);

    const allUsers = (usersRes.data || []) as UserRow[];
    const statsMap: Record<string, { property_count: number; room_count: number }> = {};
    ((statsRes.data || []) as any[]).forEach((s: any) => {
      statsMap[s.user_id] = { property_count: Number(s.property_count), room_count: Number(s.room_count) };
    });
    const subMap: Record<string, { status: string; plan: string; expires_at: string; started_at: string }> = {};
    ((subsRes.data || []) as any[]).forEach((s: any) => {
      subMap[s.user_id] = { status: s.status, plan: s.plan, expires_at: s.expires_at, started_at: s.started_at };
    });
    const propMap: Record<string, string> = {};
    ((propsRes.data || []) as any[]).forEach((p: any) => {
      if (!propMap[p.user_id]) propMap[p.user_id] = p.nama_kos;
    });
    const loginMap: Record<string, string> = {};
    ((profilesRes.data || []) as any[]).forEach((p: any) => {
      if (p.last_login) loginMap[p.id] = p.last_login;
    });

    const merged = allUsers.map(u => ({
      ...u,
      property_count: statsMap[u.id]?.property_count || 0,
      room_count: statsMap[u.id]?.room_count || 0,
      sub_status: subMap[u.id]?.status || "none",
      sub_plan: subMap[u.id]?.plan || "-",
      sub_expires: subMap[u.id]?.expires_at || undefined,
      sub_started: subMap[u.id]?.started_at || undefined,
      property_name: propMap[u.id] || "-",
      last_login: loginMap[u.id] || undefined,
    }));

    setUsers(merged);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const callEdgeFunction = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const res = await supabase.functions.invoke("admin-manage-user", { body });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  // ─── Add User ───
  const handleAddUser = async () => {
    if (!addForm.email || !addForm.password || !addForm.nama) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await callEdgeFunction({ action: "create_user", ...addForm });
      toast.success("User berhasil dibuat");
      supabase.from("admin_activity_log").insert({ admin_email: "admin", action: "create_user", detail: addForm.email } as any).then(() => {});
      setShowAdd(false);
      setAddForm({ nama: "", email: "", no_hp: "", password: "", plan: "mandiri", nama_kos: "", started_at: new Date().toISOString().split("T")[0], expires_at: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  // ─── Edit User ───
  const handleEditUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await callEdgeFunction({
        action: "update_user",
        user_id: editUser.id,
        nama: editForm.nama,
        no_hp: editForm.no_hp,
        nama_kos: editForm.nama_kos !== "-" ? editForm.nama_kos : undefined,
        plan: editForm.plan,
        status: editForm.status,
        expires_at: editForm.expires_at || undefined,
      });
      toast.success("User berhasil diupdate");
      setEditUser(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  // ─── Reset Password ───
  const handleResetPassword = async () => {
    if (!resetUser) return;
    setSaving(true);
    try {
      if (resetMode === "email") {
        await callEdgeFunction({ action: "send_reset_email", email: resetUser.email });
        toast.success("Email reset password terkirim");
      } else {
        if (!newPassword || newPassword.length < 6) {
          toast.error("Password minimal 6 karakter");
          setSaving(false);
          return;
        }
        await callEdgeFunction({ action: "reset_password", user_id: resetUser.id, new_password: newPassword });
        toast.success("Password berhasil diubah");
      }
      setResetUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  // ─── Extend ───
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
    await supabase.from("subscriptions").update({ status: "expired" } as any).eq("user_id", userId);
    supabase.from("admin_activity_log").insert({ admin_email: "admin", action: "deactivate_user", detail: userId } as any).then(() => {});
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
    await supabase.from("subscriptions").update({ plan: newPlan } as any).eq("user_id", userId);
    supabase.from("admin_activity_log").insert({ admin_email: "admin", action: "switch_plan", detail: `${userId}: ${currentPlan} → ${newPlan}` } as any).then(() => {});
    toast.success(`Paket diubah ke ${newPlan}`);
    fetchData();
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    await supabase.from("subscriptions").delete().eq("user_id", deleteUser.id);
    await supabase.from("profiles").delete().eq("id", deleteUser.id);
    toast.success("Data user dihapus");
    setDeleteUser(null);
    fetchData();
  };

  // ─── Bulk Actions ───
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(u => u.id)));
    }
  };

  const handleBulkActivate = async () => {
    setSaving(true);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    for (const id of selectedIds) {
      const u = users.find(u => u.id === id);
      if (u?.sub_status === "none") {
        await supabase.from("subscriptions").insert({ user_id: id, plan: "mandiri", status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any);
      } else {
        await supabase.from("subscriptions").update({ status: "aktif", expires_at: expiresAt.toISOString().split("T")[0] } as any).eq("user_id", id);
      }
    }
    toast.success(`${selectedIds.size} user diaktifkan`);
    setSelectedIds(new Set());
    setSaving(false);
    fetchData();
  };

  const handleBulkDeactivate = async () => {
    setSaving(true);
    for (const id of selectedIds) {
      await supabase.from("subscriptions").update({ status: "expired" } as any).eq("user_id", id);
    }
    toast.success(`${selectedIds.size} user dinonaktifkan`);
    setSelectedIds(new Set());
    setSaving(false);
    fetchData();
  };

  const handleExportCSV = () => {
    const data = filtered.length > 0 ? filtered : users;
    const header = "Nama,Email,No HP,Paket,Status,Tanggal Daftar,Nama Kos,Jumlah Kamar";
    const rows = data.map(u =>
      `"${u.nama || ""}","${u.email}","${u.no_hp || ""}","${u.sub_plan || "-"}","${u.sub_status || "-"}","${new Date(u.created_at).toLocaleDateString("id-ID")}","${u.property_name || "-"}","${u.room_count || 0}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-kospintar-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil diexport");
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

  const openEdit = (u: UserRow) => {
    setEditForm({
      nama: u.nama || "",
      no_hp: u.no_hp || "",
      nama_kos: u.property_name || "",
      plan: u.sub_plan || "mandiri",
      status: u.sub_status === "aktif" ? "aktif" : "nonaktif",
      expires_at: u.sub_expires || "",
    });
    setEditUser(u);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">User Management</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs">
              <Download size={14} className="mr-1" /> CSV
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} className="text-xs">
              <Plus size={14} className="mr-1" /> Tambah User
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
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

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-2">
            <span className="text-xs font-medium text-foreground">{selectedIds.size} dipilih</span>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleBulkActivate} disabled={saving}>
              Aktifkan semua
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30" onClick={handleBulkDeactivate} disabled={saving}>
              Nonaktifkan semua
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada user</p>
        ) : (
          <>
            {/* User cards (works for both mobile and desktop) */}
            <div className="space-y-2">
              {paginated.map(u => {
                const isExpanded = expandedId === u.id;
                return (
                  <div key={u.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedIds.has(u.id)}
                          onCheckedChange={() => toggleSelect(u.id)}
                          className="mt-1"
                        />
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : u.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{u.nama || u.email.split("@")[0]}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {statusBadge(u.sub_status, u.sub_plan)}
                              {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            <span>{u.property_name}</span>
                            <span>{u.room_count} kamar</span>
                            <span>{new Date(u.created_at).toLocaleDateString("id-ID")}</span>
                            {u.sub_expires && <span>s/d {u.sub_expires}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex gap-1.5 mt-2 flex-wrap pl-7">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(u)}>
                          <Edit size={12} className="mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setResetUser(u); setResetMode("email"); setNewPassword(""); }}>
                          <Key size={12} className="mr-1" /> Password
                        </Button>
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
                          <CalendarPlus size={12} />
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 text-destructive border-destructive/30" onClick={() => setDeleteUser(u)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded detail view */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-3 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-muted-foreground">Nama:</span> <span className="font-medium">{u.nama || "-"}</span></div>
                          <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{u.email}</span></div>
                          <div><span className="text-muted-foreground">No HP:</span> <span className="font-medium">{u.no_hp || "-"}</span></div>
                          <div><span className="text-muted-foreground">Nama Kos:</span> <span className="font-medium">{u.property_name}</span></div>
                          <div><span className="text-muted-foreground">Jumlah Kamar:</span> <span className="font-medium">{u.room_count}</span></div>
                          <div><span className="text-muted-foreground">Jumlah Properti:</span> <span className="font-medium">{u.property_count}</span></div>
                          <div><span className="text-muted-foreground">Paket:</span> <span className="font-medium">{u.sub_plan}</span></div>
                          <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{u.sub_status}</span></div>
                          <div><span className="text-muted-foreground">Mulai:</span> <span className="font-medium">{u.sub_started || "-"}</span></div>
                          <div><span className="text-muted-foreground">Berakhir:</span> <span className="font-medium">{u.sub_expires || "-"}</span></div>
                          <div><span className="text-muted-foreground">Terdaftar:</span> <span className="font-medium">{new Date(u.created_at).toLocaleString("id-ID")}</span></div>
                          <div><span className="text-muted-foreground">Last Login:</span> <span className="font-medium">{u.last_login ? new Date(u.last_login).toLocaleString("id-ID") : "Belum pernah"}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Select all + pagination */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={toggleSelectAll} className="text-xs text-primary font-medium hover:underline">
                {selectedIds.size === paginated.length ? "Batal pilih semua" : "Pilih semua"}
              </button>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Add User Modal ─── */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Tambah User Baru">
        <div className="bottom-sheet-form">
          <div className="bottom-sheet-body space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nama Lengkap *</Label>
              <Input value={addForm.nama} onChange={e => setAddForm(p => ({ ...p, nama: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">No HP</Label>
              <Input value={addForm.no_hp} onChange={e => setAddForm(p => ({ ...p, no_hp: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Password *</Label>
              <Input type="password" value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Paket</Label>
                <Select value={addForm.plan} onValueChange={v => setAddForm(p => ({ ...p, plan: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandiri">Mandiri</SelectItem>
                    <SelectItem value="juragan">Juragan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nama Kos</Label>
                <Input value={addForm.nama_kos} onChange={e => setAddForm(p => ({ ...p, nama_kos: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tanggal Aktif</Label>
                <Input type="date" value={addForm.started_at} onChange={e => setAddForm(p => ({ ...p, started_at: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tanggal Expired</Label>
                <Input type="date" value={addForm.expires_at} onChange={e => setAddForm(p => ({ ...p, expires_at: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="bottom-sheet-footer">
            <Button className="w-full" onClick={handleAddUser} disabled={saving}>
              {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : "Buat User"}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* ─── Edit User Modal ─── */}
      <BottomSheet open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <div className="bottom-sheet-form">
            <div className="bottom-sheet-body space-y-3">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-xs text-muted-foreground">{editUser.email}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nama</Label>
                <Input value={editForm.nama} onChange={e => setEditForm(p => ({ ...p, nama: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No HP</Label>
                <Input value={editForm.no_hp} onChange={e => setEditForm(p => ({ ...p, no_hp: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nama Kos</Label>
                <Input value={editForm.nama_kos} onChange={e => setEditForm(p => ({ ...p, nama_kos: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Paket</Label>
                  <Select value={editForm.plan} onValueChange={v => setEditForm(p => ({ ...p, plan: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mandiri">Mandiri</SelectItem>
                      <SelectItem value="juragan">Juragan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tanggal Expired</Label>
                <Input type="date" value={editForm.expires_at} onChange={e => setEditForm(p => ({ ...p, expires_at: e.target.value }))} />
              </div>
            </div>
            <div className="bottom-sheet-footer">
              <Button className="w-full" onClick={handleEditUser} disabled={saving}>
                {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ─── Reset Password Modal ─── */}
      <BottomSheet open={!!resetUser} onClose={() => setResetUser(null)} title="Reset Password">
        {resetUser && (
          <div className="bottom-sheet-form">
            <div className="bottom-sheet-body space-y-3">
              <div className="bg-muted rounded-lg p-2">
                <p className="text-sm font-medium">{resetUser.nama || resetUser.email}</p>
                <p className="text-xs text-muted-foreground">{resetUser.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setResetMode("email")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    resetMode === "email" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Mail size={14} className="inline mr-1" /> Kirim Email
                </button>
                <button
                  onClick={() => setResetMode("manual")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    resetMode === "manual" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <Key size={14} className="inline mr-1" /> Set Manual
                </button>
              </div>
              {resetMode === "email" ? (
                <p className="text-xs text-muted-foreground">Email berisi link reset password akan dikirim ke <strong>{resetUser.email}</strong></p>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs">Password Baru (min 6 karakter)</Label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password baru..." />
                </div>
              )}
            </div>
            <div className="bottom-sheet-footer">
              <Button className="w-full" onClick={handleResetPassword} disabled={saving}>
                {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Memproses...</> : resetMode === "email" ? "Kirim Email Reset" : "Set Password Baru"}
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ─── Extend Modal ─── */}
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
        onClose={() => setDeleteUser(null)}
        itemName={`data ${deleteUser?.nama || deleteUser?.email || "user"}`}
        onConfirm={handleDeleteUser}
      />
    </AdminLayout>
  );
}
