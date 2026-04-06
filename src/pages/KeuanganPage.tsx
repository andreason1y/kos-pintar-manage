import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah, getMonthName } from "@/lib/helpers";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const EXPENSE_CATEGORIES = ["Listrik", "Air", "Kebersihan", "Perbaikan", "Internet", "Keamanan", "Lainnya"];

export default function KeuanganPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const [loading, setLoading] = useState(true);
  const [pemasukan, setPemasukan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("Lainnya");
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState(now.toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  const fetchData = async () => {
    if (demo.isDemo) {
      const txData = demo.transactions.filter(t => t.periode_bulan === bulan && t.periode_tahun === tahun);
      const expData = demo.expenses; // all in current month
      const totalPemasukan = txData.reduce((s, t) => s + t.jumlah_dibayar, 0);
      const totalPengeluaran = expData.reduce((s, e) => s + e.jumlah, 0);
      setPemasukan(totalPemasukan);
      setPengeluaran(totalPengeluaran);

      const combined = [
        ...txData.filter(t => t.jumlah_dibayar > 0).map(t => ({ type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)}`, date: t.tanggal_bayar || t.created_at })),
        ...expData.map(e => ({ type: "expense", amount: e.jumlah, label: e.judul, date: e.tanggal })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setItems(combined);
      setLoading(false);
      return;
    }

    if (!activeProperty) return;
    setLoading(true);
    const pid = activeProperty.id;
    const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const endMonth = bulan === 12 ? 1 : bulan + 1;
    const endYear = bulan === 12 ? tahun + 1 : tahun;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const [txRes, expRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("property_id", pid).eq("periode_bulan", bulan).eq("periode_tahun", tahun).order("created_at", { ascending: false }) as any,
      supabase.from("expenses").select("*").eq("property_id", pid).gte("tanggal", startDate).lt("tanggal", endDate).order("tanggal", { ascending: false }) as any,
    ]);

    const txData = (txRes.data || []) as any[];
    const expData = (expRes.data || []) as any[];

    setPemasukan(txData.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0));
    setPengeluaran(expData.reduce((s: number, e: any) => s + (e.jumlah || 0), 0));

    const combined = [
      ...txData.filter((t: any) => t.jumlah_dibayar > 0).map((t: any) => ({ type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)}`, date: t.tanggal_bayar || t.created_at })),
      ...expData.map((e: any) => ({ type: "expense", amount: e.jumlah, label: e.judul, date: e.tanggal })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setItems(combined);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeProperty, bulan, tahun, demo.isDemo]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    if (!activeProperty) return;
    const { error } = await supabase.from("expenses").insert({ property_id: activeProperty.id, judul, kategori, jumlah: parseInt(jumlah) || 0, tanggal, is_recurring: isRecurring } as any);
    if (error) toast.error(error.message);
    else { toast.success("Pengeluaran ditambahkan!"); setShowAdd(false); setJudul(""); setJumlah(""); fetchData(); }
  };

  const selisih = pemasukan - pengeluaran;

  return (
    <AppShell>
      <PageHeader title="Keuangan" subtitle={`${getMonthName(bulan)} ${tahun}`} />
      <div className="px-4 space-y-4">
        <div className="flex gap-2">
          <Select value={String(bulan)} onValueChange={v => setBulan(parseInt(v))}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{getMonthName(i + 1)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(tahun)} onValueChange={v => setTahun(parseInt(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3"><SkeletonCard lines={2} /><SkeletonCard /><SkeletonCard /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card rounded-xl border border-border p-3 text-center">
                <TrendingUp size={18} className="text-success mx-auto" />
                <p className="text-xs text-muted-foreground mt-1">Pemasukan</p>
                <p className="text-sm font-bold text-foreground">{formatRupiah(pemasukan)}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 text-center">
                <TrendingDown size={18} className="text-destructive mx-auto" />
                <p className="text-xs text-muted-foreground mt-1">Pengeluaran</p>
                <p className="text-sm font-bold text-foreground">{formatRupiah(pengeluaran)}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 text-center">
                <Minus size={18} className={`mx-auto ${selisih >= 0 ? "text-success" : "text-destructive"}`} />
                <p className="text-xs text-muted-foreground mt-1">Selisih</p>
                <p className={`text-sm font-bold ${selisih >= 0 ? "text-success" : "text-destructive"}`}>{formatRupiah(selisih)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-foreground">Transaksi</h2>
              <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} className="mr-1" /> Pengeluaran</Button>
            </div>

            {items.length === 0 ? (
              <EmptyState title="Belum ada transaksi" description="Transaksi akan muncul di sini" />
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="flex justify-between items-center bg-card rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                        {item.type === "income" ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${item.type === "income" ? "text-success" : "text-destructive"}`}>
                      {item.type === "income" ? "+" : "-"}{formatRupiah(item.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Pengeluaran">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="space-y-2"><Label>Judul</Label><Input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Bayar listrik" required /></div>
          <div className="space-y-2"><Label>Kategori</Label>
            <Select value={kategori} onValueChange={setKategori}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Jumlah (Rp)</Label><Input type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} /></div>
          <div className="flex items-center justify-between"><Label>Pengeluaran Rutin</Label><Switch checked={isRecurring} onCheckedChange={setIsRecurring} /></div>
          <Button type="submit" className="w-full">Simpan</Button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
