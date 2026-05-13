import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import AdminLayout from "./AdminLayout";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Clock, Loader2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";

interface SubRow {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string;
  email?: string;
  nama?: string;
}

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivate, setShowActivate] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  // Activate form
  const [activateEmail, setActivateEmail] = useState("");
  const [activatePlan, setActivatePlan] = useState("mini");
  const [activateMonths, setActivateMonths] = useState("12");
  const [saving, setSaving] = useState(false);

  // Extend form
  const [extendEmail, setExtendEmail] = useState("");
  const [extendMonths, setExtendMonths] = useState("1");

  const fetchData = async () => {
    setLoading(true);
    const [subsRes, usersRes] = await Promise.all([
      supabase.from("subscriptions").select("*"),
      supabase.rpc("admin_get_users"),
    ]);
    const allSubs = (subsRes.data || []) as SubRow[];
    const userMap: Record<string, { email: string; nama: string | null }> = {};
    (usersRes.data || []).forEach(u => {
      const row = u as { id: string; email: string; nama: string | null };
      userMap[row.id] = { email: row.email, nama: row.nama };
    });
    const merged = allSubs.map(s => ({
      ...s,
      email: userMap[s.user_id]?.email || "Unknown",
      nama: userMap[s.user_id]?.nama || null,
    }));
    setSubs(merged);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiringSoon = subs.filter(s => {
    if (s.status !== "aktif") return false;
    const exp = new Date(s.expires_at);
    return exp >= now && exp <= in30Days;
  }).sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());

  const handleActivate = async () => {
    if (!activateEmail.trim()) { toast.error("Email harus diisi"); return; }
    setSaving(true);

    // Find user by email
    const { data: usersData } = await supabase.rpc("admin_get_users");
    const found = (usersData || []).find(u => (u as { email: string }).email === activateEmail.trim()) as { id: string; email: string } | undefined;
    if (!found) { toast.error("User tidak ditemukan"); setSaving(false); return; }

    const months = parseInt(activateMonths) || 12;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Check existing sub
    const { data: existingSub } = await supabase.from("subscriptions")
      .select("*").eq("user_id", found.id).limit(1);

    if (existingSub && existingSub.length > 0) {
      await supabase.from("subscriptions")
        .update({ plan: activatePlan, status: "aktif", expires_at: expiresAt.toISOString().split("T")[0], duration_months: months })
        .eq("user_id", found.id);
    } else {
      await supabase.from("subscriptions")
        .insert({ user_id: found.id, plan: activatePlan, status: "aktif", expires_at: expiresAt.toISOString().split("T")[0], duration_months: months });
    }

    toast.success(`Subscription ${activatePlan} diaktifkan untuk ${activateEmail}`);
    setSaving(false);
    setShowActivate(false);
    setActivateEmail("");
    fetchData();
  };

  const handleExtend = async () => {
    if (!extendEmail.trim()) { toast.error("Email harus diisi"); return; }
    setSaving(true);

    const { data: usersData } = await supabase.rpc("admin_get_users");
    const found = (usersData || []).find(u => (u as { email: string }).email === extendEmail.trim()) as { id: string; email: string } | undefined;
    if (!found) { toast.error("User tidak ditemukan"); setSaving(false); return; }

    const { data: existingSub } = await supabase.from("subscriptions")
      .select("*").eq("user_id", found.id).limit(1);

    if (!existingSub || existingSub.length === 0) {
      toast.error("User belum punya subscription"); setSaving(false); return;
    }

    const months = parseInt(extendMonths) || 1;
    let startDate = new Date();
    const currentExpiry = new Date(existingSub[0].expires_at);
    if (currentExpiry > startDate) startDate = currentExpiry;
    startDate.setMonth(startDate.getMonth() + months);

    await supabase.from("subscriptions")
      .update({ status: "aktif", expires_at: startDate.toISOString().split("T")[0], duration_months: months })
      .eq("user_id", found.id);

    toast.success(`Subscription diperpanjang ${months} bulan`);
    setSaving(false);
    setShowExtend(false);
    setExtendEmail("");
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Subscription Management</h2>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowActivate(true)}>
              <UserPlus size={14} className="mr-1" /> Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowExtend(true)}>
              <CalendarPlus size={14} className="mr-1" /> Extend
            </Button>
          </div>
        </div>

        {/* Expiring soon */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[hsl(var(--warning))]" />
            <h3 className="text-sm font-semibold text-foreground">Expiring in 30 Days ({expiringSoon.length})</h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : expiringSoon.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Tidak ada subscription yang akan expired</p>
          ) : (
            <div className="space-y-2">
              {expiringSoon.map(s => {
                const daysLeft = Math.ceil((new Date(s.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.nama || s.email}</p>
                      <p className="text-xs text-muted-foreground">{s.email} · {s.plan}</p>
                    </div>
                    <span className={`text-xs font-bold ${daysLeft <= 7 ? 'text-destructive' : 'text-[hsl(var(--warning))]'}`}>
                      {daysLeft} hari lagi
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* All subscriptions */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">All Subscriptions ({subs.length})</h3>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {subs.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.nama || s.email}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.status === "aktif"
                        ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                        : "bg-destructive/15 text-destructive"
                    }`}>{s.plan} · {s.status}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">s/d {s.expires_at}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activate modal */}
      <BottomSheet open={showActivate} onClose={() => setShowActivate(false)} title="Activate Subscription">
        <div className="bottom-sheet-form">
          <div className="bottom-sheet-body space-y-3">
            <div className="space-y-1">
              <Label>Email User</Label>
              <Input value={activateEmail} onChange={e => setActivateEmail(e.target.value)} placeholder="user@email.com" />
            </div>
            <div className="space-y-1">
              <Label>Paket</Label>
              <Select value={activatePlan} onValueChange={setActivatePlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mini">Mini (10 kamar)</SelectItem>
                  <SelectItem value="starter">Starter (25 kamar)</SelectItem>
                  <SelectItem value="pro">Pro (60 kamar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Durasi (bulan)</Label>
              <div className="flex gap-2">
                {[1, 3, 6, 12].map(m => (
                  <button key={m} onClick={() => setActivateMonths(String(m))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      activateMonths === String(m) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                    }`}>{m} bln</button>
                ))}
              </div>
            </div>
          </div>
          <div className="bottom-sheet-footer">
            <Button className="w-full" onClick={handleActivate} disabled={saving}>
              {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : "Activate Subscription"}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Extend modal */}
      <BottomSheet open={showExtend} onClose={() => setShowExtend(false)} title="Extend Subscription">
        <div className="bottom-sheet-form">
          <div className="bottom-sheet-body space-y-3">
            <div className="space-y-1">
              <Label>Email User</Label>
              <Input value={extendEmail} onChange={e => setExtendEmail(e.target.value)} placeholder="user@email.com" />
            </div>
            <div className="space-y-1">
              <Label>Tambah Bulan</Label>
              <div className="flex gap-2">
                {[1, 3, 6, 12].map(m => (
                  <button key={m} onClick={() => setExtendMonths(String(m))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      extendMonths === String(m) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                    }`}>{m} bln</button>
                ))}
              </div>
            </div>
          </div>
          <div className="bottom-sheet-footer">
            <Button className="w-full" onClick={handleExtend} disabled={saving}>
              {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : "Extend Subscription"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AdminLayout>
  );
}
