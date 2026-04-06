import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, LogOut, User, Info, Crown, Sparkles, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getAvatarColor } from "@/lib/avatar-colors";

export default function ProfilPage() {
  const { session, user, signOut } = useAuth();
  const { properties, activeProperty, setActiveProperty, refetch } = useProperty();
  const demo = useDemo();
  const [profile, setProfile] = useState<{ nama: string | null; no_hp: string | null } | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!user || demo.isDemo) return;
    supabase.from("profiles").select("nama, no_hp").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user, demo.isDemo]);

  const handleLogout = () => {
    if (demo.isDemo) {
      demo.setIsDemo(false);
      return;
    }
    signOut();
  };

  const handleReset = async () => {
    if (!session) return;
    setResetting(true);
    try {
      const kosName = activeProperty?.nama_kos || "Kos Saya";
      const kosAlamat = activeProperty?.alamat || "";
      const res = await supabase.functions.invoke("seed-user-data", {
        body: { nama_kos: kosName, alamat: kosAlamat, reset: true },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) {
        toast.error("Gagal reset: " + res.error.message);
      } else {
        toast.success("Data berhasil direset ke data awal!");
        refetch();
      }
    } catch (err: any) {
      toast.error("Gagal: " + err.message);
    }
    setResetting(false);
  };

  const displayProperties = demo.isDemo ? [demo.property] : properties;
  const displayActive = demo.isDemo ? demo.property : activeProperty;

  const displayName = demo.isDemo ? "Demo User" : (profile?.nama || user?.user_metadata?.nama || user?.email?.split("@")[0] || "Pengguna");
  const displayEmail = demo.isDemo ? "demo@kospintar.id" : (user?.email || "");
  const displayPhone = demo.isDemo ? null : (profile?.no_hp || null);
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarColor = getAvatarColor(displayName);

  return (
    <AppShell>
      <PageHeader title="Profil" />
      <div className="px-4 space-y-4">
        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: avatarColor }}>
              {initials}
            </div>
            <div>
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
              {displayPhone && <p className="text-xs text-muted-foreground">{displayPhone}</p>}
            </div>
          </div>

          {demo.isDemo && (
            <div className="bg-secondary rounded-lg p-3 flex items-start gap-2">
              <Info size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-secondary-foreground">Anda sedang menggunakan mode demo. Data yang ditampilkan adalah contoh dan tidak disimpan.</p>
            </div>
          )}
        </motion.div>

        {/* Subscription Status */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border border-border p-4 shadow-sm"
        >
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

        {/* Properties */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Properti</h2>
          <div className="space-y-2">
            {displayProperties.map(p => (
              <button key={p.id} onClick={() => !demo.isDemo && setActiveProperty(p as any)}
                className={`w-full text-left p-3 rounded-xl border transition-colors shadow-sm ${displayActive?.id === p.id ? "border-primary bg-secondary" : "border-border bg-card"}`}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={18} className={displayActive?.id === p.id ? "text-primary" : "text-muted-foreground"} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.nama_kos}</p>
                    {p.alamat && <p className="text-xs text-muted-foreground">{p.alamat}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pengaturan */}
        {!demo.isDemo && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Pengaturan</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2" disabled={resetting}>
                  <RotateCcw size={16} /> {resetting ? "Mereset data..." : "Reset ke Data Awal"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua data akan dihapus dan diganti dengan data contoh baru. Tindakan ini tidak bisa dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Logout */}
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
                {demo.isDemo
                  ? "Anda akan keluar dari mode demo. Lanjutkan?"
                  : "Anda akan keluar dari akun. Lanjutkan?"
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Keluar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* App Version */}
        <p className="text-center text-[10px] text-muted-foreground pb-4">KosPintar v1.0.0</p>
      </div>
    </AppShell>
  );
}
