import { useState, useEffect } from "react";
import { useSearchParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";

const RESEND_COOLDOWN = 60;

export default function EmailSentPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const isExisting = searchParams.get("existing") === "1";

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setResendCooldown(RESEND_COOLDOWN);
      toast.success("Email verifikasi telah dikirim ulang");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim ulang email";
      toast.error(msg.includes("429") ? "Terlalu banyak permintaan. Coba lagi nanti." : msg);
    } finally {
      setLoading(false);
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MailCheck size={28} className="text-primary" />
            </div>

            {isExisting ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Email sudah terdaftar</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Email{" "}
                    <span className="font-medium text-foreground">{email}</span>{" "}
                    sudah pernah digunakan untuk mendaftar di KosPintar.
                  </p>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-left">
                  <p className="text-xs text-amber-800">
                    Jika ini akun Anda, silakan masuk langsung atau gunakan fitur{" "}
                    <strong>Lupa Kata Sandi</strong> jika lupa password.
                  </p>
                </div>

                <Link to="/login">
                  <Button className="w-full">Masuk ke akun</Button>
                </Link>
                <Link to="/lupa-sandi">
                  <Button variant="outline" className="w-full">Lupa Kata Sandi</Button>
                </Link>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Cek email Anda</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kami telah mengirimkan link verifikasi ke{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                    Silakan cek kotak masuk atau folder spam, lalu klik link di email untuk mengaktifkan akun.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                >
                  {loading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Mengirim...</>
                  ) : resendCooldown > 0 ? (
                    `Kirim ulang dalam ${resendCooldown}s`
                  ) : (
                    <><RefreshCw size={16} className="mr-2" /> Kirim ulang email verifikasi</>
                  )}
                </Button>

                <div className="rounded-lg bg-muted p-3 text-left">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Email tidak kunjung datang?</strong>{" "}
                    Kemungkinan email ini sudah pernah terdaftar sebelumnya. Coba{" "}
                    <Link to="/lupa-sandi" className="text-primary hover:underline">
                      gunakan fitur Lupa Kata Sandi
                    </Link>{" "}
                    untuk masuk ke akun Anda.
                  </p>
                </div>
              </>
            )}

            <Link to="/login">
              <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                <ArrowLeft size={14} className="mr-1.5" />
                Kembali ke halaman masuk
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
