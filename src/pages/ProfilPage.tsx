import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { usePlan } from "@/lib/plan-context";
import { useProfile, useInvalidate } from "@/hooks/use-queries";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, LogOut, User, Info, Crown, Sparkles, Pencil, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ProfilPage() {
  const { user, signOut } = useAuth();
  const { properties, activeProperty, setActiveProperty, refetch: refetchProperties } = useProperty();
  const demo = useDemo();
  const invalidate = useInvalidate();

  const { data: profileData } = useProfile(user?.id);

  const [showEdit, setShowEdit] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(false);
  const [editNama, setEditNama] = useState("");
  const [editHp, setEditHp] = useState("");
  const [editKosName, setEditKosName] = useState("");
  const [editKosAlamat, setEditKosAlamat] = useState("");
  const [editPropertyId, setEditPropertyId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    if (demo.isDemo) { demo.setIsDemo(false); return; }
    signOut();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nama: editNama, no_hp: editHp || null } as any).eq("id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Profil diperbarui!");
      invalidate.profile();
      setShowEdit(false);
    }
    setSaving(false);
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo || !user) return;
    setSaving(true);
    const { error } = await supabase.from("properties").update({ nama_kos: editKosName, alamat: editKosAlamat || null } as any).eq("id", editPropertyId);
    if (error) toast.error(error.message);
    else {
      toast.success("Properti diperbarui!");
      setShowEditProperty(false);
      refetchProperties();
    }
    setSaving(false);
  };

  const displayProperties = demo.isDemo ? [demo.property] : properties;
  const displayActive = demo.isDemo ? demo.property : activeProperty;
  const displayName = demo.isDemo ? "Demo User" : (profileData?.nama || user?.user_metadata?.nama || user?.email?.split("@")[0] || "Pengguna");
  const displayEmail = demo.isDemo ? "demo@kospintar.id" : (user?.email || "-");
  const displayHp = demo.isDemo ? "-" : (profileData?.no_hp || user?.user_metadata?.no_hp || "-");

  return (
    <AppShell>
      <PageHeader title="Profil" />
      <div className="px-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <User size={24} className="text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{displayEmail}</p>
              {displayHp !== "-" && <p className="text-xs text-muted-foreground">{displayHp}</p>}
            </div>
            {!demo.isDemo && (
              <button onClick={() => { setEditNama(profileData?.nama || user?.user_metadata?.nama || ""); setEditHp(profileData?.no_hp || user?.user_metadata?.no_hp || ""); setShowEdit(true); }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
                <Pencil size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
          {demo.isDemo && (
            <div className="bg-secondary rounded-lg p-3 flex items-start gap-2">
              <Info size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-secondary-foreground">Anda sedang menggunakan mode demo. Data yang ditampilkan adalah contoh dan tidak disimpan.</p>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03, duration: 0.15 }}
          className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
              <Crown size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">Early Bird</p>
                <span className="px-2 py-0.5 rounded-full bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)] text-[10px] font-bold">AKTIF</span>
              </div>
              <p className="text-xs text-muted-foreground">Aktif hingga 31 Desember 2026</p>
            </div>
            <Sparkles size={16} className="text-accent" />
          </div>
        </motion.div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Properti</h2>
          <div className="space-y-2">
            {displayProperties.map(p => (
              <div key={p.id} className="relative">
                <button onClick={() => !demo.isDemo && setActiveProperty(p as any)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors shadow-sm ${displayActive?.id === p.id ? "border-primary bg-secondary" : "border-border bg-card"}`}>
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className={displayActive?.id === p.id ? "text-primary" : "text-muted-foreground"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.nama_kos}</p>
                      {p.alamat && <p className="text-xs text-muted-foreground">{p.alamat}</p>}
                    </div>
                    {!demo.isDemo && (
                      <div role="button" onClick={(e) => { e.stopPropagation(); setEditPropertyId(p.id); setEditKosName(p.nama_kos); setEditKosAlamat(p.alamat || ""); setShowEditProperty(true); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted">
                        <Pencil size={14} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full text-destructive border-destructive/30">
              <LogOut size={16} className="mr-2" /> {demo.isDemo ? "Keluar Demo" : "Keluar"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
              <AlertDialogDescription>
                {demo.isDemo ? "Anda akan keluar dari mode demo. Lanjutkan?" : "Anda akan keluar dari akun. Lanjutkan?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Keluar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-[10px] text-muted-foreground pb-4">KosPintar v1.0.0</p>
      </div>

      <BottomSheet open={showEdit} onClose={() => setShowEdit(false)} title="Edit Profil">
        <form onSubmit={handleSaveProfile} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={editNama} onChange={e => setEditNama(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled className="bg-muted" /><p className="text-[10px] text-muted-foreground">Email tidak dapat diubah</p></div>
            <div className="space-y-2"><Label>No. HP</Label><Input value={editHp} onChange={e => setEditHp(e.target.value)} placeholder="08123456789" /></div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : "Simpan Profil"}
            </Button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={showEditProperty} onClose={() => setShowEditProperty(false)} title="Edit Properti">
        <form onSubmit={handleSaveProperty} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Nama Kos</Label>
              <div className="relative"><Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={editKosName} onChange={e => setEditKosName(e.target.value)} className="pl-9" required /></div>
            </div>
            <div className="space-y-2"><Label>Alamat</Label>
              <div className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={editKosAlamat} onChange={e => setEditKosAlamat(e.target.value)} className="pl-9" placeholder="Jl. Contoh No. 123" /></div>
            </div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : "Simpan Properti"}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
