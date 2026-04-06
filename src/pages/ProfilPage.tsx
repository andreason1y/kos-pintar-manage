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
import { Building2, LogOut, User, Info, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilPage() {
  const { signOut } = useAuth();
  const { properties, activeProperty, setActiveProperty } = useProperty();
  const demo = useDemo();

  const handleLogout = () => {
    if (demo.isDemo) {
      demo.setIsDemo(false);
      return;
    }
    signOut();
  };

  const displayProperties = demo.isDemo ? [demo.property] : properties;
  const displayActive = demo.isDemo ? demo.property : activeProperty;

  return (
    <AppShell>
      <PageHeader title="Profil" />
      <div className="px-4 space-y-4">
        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <User size={24} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{demo.isDemo ? "Demo User" : "Pengguna"}</p>
              <p className="text-sm text-muted-foreground">{demo.isDemo ? "demo@kospintar.id" : "user@email.com"}</p>
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
