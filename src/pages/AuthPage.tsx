import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nama } },
      });
      if (error) toast.error(error.message);
      else toast.success("Akun berhasil dibuat! Silakan cek email untuk verifikasi.");
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
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-primary-foreground" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">KosPintar</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola kos-kosan lebih mudah</p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Anda" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
