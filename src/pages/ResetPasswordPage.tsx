import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";

type PageState = "loading" | "ready" | "success" | "invalid";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from Supabase (triggered when
    // the user arrives via the reset-password email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("ready");
      }
    });

    // Fallback: if a session already exists when this page loads
    // (e.g. the auth state change fired before this component mounted),
    // still show the form. We use a short timeout so the listener above
    // gets a chance to fire first.
    const timer = setTimeout(async () => {
      if (pageState === "loading") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setPageState("ready");
        } else {
          setPageState("invalid");
        }
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Kata sandi dan konfirmasi tidak cocok");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Sign out after successful reset so the user must log in with new password
    await supabase.auth.signOut();
    setPageState("success");
    setLoading(false);
  };

  const renderContent = () => {
    switch (pageState) {
      case "loading":
        return (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memverifikasi link reset...</p>
          </div>
        );

      case "invalid":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle size={28} className="text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Link tidak valid</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Link reset kata sandi sudah kadaluarsa atau tidak valid. Silakan minta link baru.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/lupa-sandi")}>
              Minta Link Baru
            </Button>
          </motion.div>
        );

      case "success":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Kata sandi berhasil diubah!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Kata sandi Anda telah diperbarui. Silakan masuk dengan kata sandi baru Anda.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Masuk Sekarang
            </Button>
          </motion.div>
        );

      case "ready":
        return (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-foreground">Buat kata sandi baru</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Masukkan kata sandi baru Anda di bawah ini.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi Baru</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  "Simpan Kata Sandi Baru"
                )}
              </Button>
            </form>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src={logoIcon} alt="KosPintar" width={80} height={80} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">KosPintar</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola kos-kosan lebih mudah</p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}
