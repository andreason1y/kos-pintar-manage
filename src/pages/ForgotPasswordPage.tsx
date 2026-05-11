import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-sandi`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
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

        <div className="bg-card rounded-xl p-6  border border-border">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <MailCheck size={28} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Email terkirim!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Kami telah mengirimkan link reset kata sandi ke{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  Silakan cek kotak masuk atau folder spam Anda.
                </p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full mt-2">
                  <ArrowLeft size={16} className="mr-2" />
                  Kembali ke halaman masuk
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-foreground">Lupa kata sandi?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Masukkan email Anda dan kami akan mengirimkan link untuk mereset kata sandi.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" /> Mengirim...</>
                  ) : (
                    "Kirim Link Reset"
                  )}
                </Button>
              </form>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
              >
                <ArrowLeft size={14} />
                Kembali ke halaman masuk
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
