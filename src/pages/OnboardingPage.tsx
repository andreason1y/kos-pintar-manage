import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { refetch } = useProperty();
  const [namaKos, setNamaKos] = useState("");
  const [alamat, setAlamat] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("properties").insert({
      user_id: user.id,
      nama_kos: namaKos,
      alamat: alamat || null,
    } as any);
    if (error) toast.error("Gagal menambahkan kos: " + error.message);
    else {
      toast.success("Kos berhasil ditambahkan!");
      refetch();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-primary-foreground" size={32} />
          </div>
          <h1 className="text-xl font-bold text-foreground">Tambah Kos Pertama Anda</h1>
          <p className="text-sm text-muted-foreground mt-1">Mulai kelola properti Anda</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="namaKos">Nama Kos</Label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="namaKos" value={namaKos} onChange={(e) => setNamaKos(e.target.value)} placeholder="Kos Harmoni" className="pl-9" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat</Label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Jl. Contoh No. 123" className="pl-9" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Mulai Sekarang"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
