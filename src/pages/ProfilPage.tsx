import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, LogOut, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProfilPage() {
  const { user, signOut } = useAuth();
  const { properties, refetch, activeProperty, setActiveProperty } = useProperty();
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddProp, setShowAddProp] = useState(false);
  const [namaKos, setNamaKos] = useState("");
  const [alamat, setAlamat] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }: any) => {
      if (data) { setNama(data.nama || ""); setNoHp(data.no_hp || ""); }
    });
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ nama, no_hp: noHp } as any).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profil diperbarui!");
    setLoading(false);
  };

  const addProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("properties").insert({ user_id: user.id, nama_kos: namaKos, alamat: alamat || null } as any);
    if (error) toast.error(error.message);
    else { toast.success("Properti ditambahkan!"); setShowAddProp(false); setNamaKos(""); setAlamat(""); refetch(); }
  };

  return (
    <AppShell>
      <PageHeader title="Profil" />
      <div className="px-4 space-y-4">
        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <User size={24} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{nama || user?.email}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input value={nama} onChange={e => setNama(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>No. HP</Label>
              <Input value={noHp} onChange={e => setNoHp(e.target.value)} placeholder="08123456789" />
            </div>
            <Button onClick={updateProfile} disabled={loading} className="w-full">
              {loading ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>
        </motion.div>

        {/* Properties */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-foreground">Properti Saya</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAddProp(true)}>
              <Plus size={14} className="mr-1" /> Tambah
            </Button>
          </div>
          <div className="space-y-2">
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProperty(p)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  activeProperty?.id === p.id ? "border-primary bg-secondary" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={18} className={activeProperty?.id === p.id ? "text-primary" : "text-muted-foreground"} />
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
        <Button variant="outline" onClick={signOut} className="w-full text-destructive border-destructive/30">
          <LogOut size={16} className="mr-2" /> Keluar
        </Button>
      </div>

      <BottomSheet open={showAddProp} onClose={() => setShowAddProp(false)} title="Tambah Properti">
        <form onSubmit={addProperty} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Kos</Label>
            <Input value={namaKos} onChange={e => setNamaKos(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input value={alamat} onChange={e => setAlamat(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Simpan</Button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
