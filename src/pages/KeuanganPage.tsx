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
import SwipeableRow from "@/components/SwipeableRow";
import { Plus, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const EXPENSE_CATEGORIES = ["Listrik", "Air", "Kebersihan", "Perbaikan", "Internet", "Keamanan", "Lainnya"];

interface MonthData {
  bulan: string;
  pemasukan: number;
  pengeluaran: number;
}

interface UnpaidItem {
  nama: string;
  kamar: string;
  sisa: number;
}

export default function KeuanganPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const [loading, setLoading] = useState(true);
  const [pemasukan, setPemasukan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [pemasukanLalu, setPemasukanLalu] = useState(0);
  const [pengeluaranLalu, setPengeluaranLalu] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [barData, setBarData] = useState<MonthData[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [unpaidList, setUnpaidList] = useState<UnpaidItem[]>([]);
  const [totalUnpaid, setTotalUnpaid] = useState(0);

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("Lainnya");
  const [jumlah, setJumlah] = useState("");
  const [tanggal, setTanggal] = useState(now.toISOString().split("T")[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  const PIE_COLORS = [
    "hsl(171, 77%, 32%)", "hsl(38, 92%, 50%)", "hsl(262, 52%, 47%)",
    "hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)",
  ];

  const fetchData = async () => {
    if (demo.isDemo) {
      const txAll = demo.transactions;
      const txData = txAll.filter(t => t.periode_bulan === bulan && t.periode_tahun === tahun);
      const expData = demo.expenses;
      const totalPemasukan = txData.reduce((s, t) => s + t.jumlah_dibayar, 0);
      const totalPengeluaran = expData.reduce((s, e) => s + e.jumlah, 0);
      setPemasukan(totalPemasukan);
      setPengeluaran(totalPengeluaran);

      // Last month comparison
      const bl = bulan === 1 ? 12 : bulan - 1;
      const tl = bulan === 1 ? tahun - 1 : tahun;
      const txLalu = txAll.filter(t => t.periode_bulan === bl && t.periode_tahun === tl);
      setPemasukanLalu(txLalu.reduce((s, t) => s + t.jumlah_dibayar, 0));
      setPengeluaranLalu(totalPengeluaran * 0.9);

      // Bar chart - last 6 months
      const bars: MonthData[] = [];
      for (let i = 5; i >= 0; i--) {
        let mb = bulan - i;
        let mt = tahun;
        while (mb <= 0) { mb += 12; mt--; }
        const txM = txAll.filter(t => t.periode_bulan === mb && t.periode_tahun === mt);
        const pem = txM.reduce((s, t) => s + t.jumlah_dibayar, 0);
        const pen = i === 0 ? totalPengeluaran : totalPengeluaran * (0.8 + Math.random() * 0.3);
        bars.push({ bulan: getMonthName(mb).slice(0, 3), pemasukan: pem, pengeluaran: Math.round(pen) });
      }
      setBarData(bars);

      // Pie chart - income by room type
      const pieMap: Record<string, number> = {};
      txData.forEach(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
        const rt = room ? demo.roomTypes.find(r => r.id === room.room_type_id) : null;
        const label = rt?.nama || "Lainnya";
        pieMap[label] = (pieMap[label] || 0) + tx.jumlah_dibayar;
      });
      setPieData(Object.entries(pieMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })));

      // Unpaid tenants
      const unpaid = txData.filter(t => t.status !== "lunas").map(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
        return { nama: tenant?.nama || "-", kamar: room?.nomor || "-", sisa: tx.total_tagihan - tx.jumlah_dibayar };
      });
      setUnpaidList(unpaid);
      setTotalUnpaid(unpaid.reduce((s, u) => s + u.sisa, 0));

      const combined = [
        ...txData.filter(t => t.jumlah_dibayar > 0).map(t => ({ id: t.id, type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)}`, date: t.tanggal_bayar || t.created_at })),
        ...expData.map(e => ({ id: e.id, type: "expense", amount: e.jumlah, label: e.judul, date: e.tanggal, kategori: e.kategori, is_recurring: e.is_recurring })),
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

    const totalPem = txData.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0);
    const totalPen = expData.reduce((s: number, e: any) => s + (e.jumlah || 0), 0);
    setPemasukan(totalPem);
    setPengeluaran(totalPen);

    // Unpaid
    const unpaidTx = txData.filter((t: any) => t.status !== "lunas");
    const tenantIds = [...new Set(unpaidTx.map((t: any) => t.tenant_id))];
    let tenantMap: Record<string, any> = {};
    if (tenantIds.length > 0) {
      const { data: td } = await supabase.from("tenants").select("id, nama, room_id").in("id", tenantIds) as any;
      (td || []).forEach((t: any) => { tenantMap[t.id] = t; });
    }
    const roomIds = Object.values(tenantMap).filter((t: any) => t.room_id).map((t: any) => t.room_id);
    let roomMap: Record<string, string> = {};
    if (roomIds.length > 0) {
      const { data: rd } = await supabase.from("rooms").select("id, nomor").in("id", roomIds) as any;
      (rd || []).forEach((r: any) => { roomMap[r.id] = r.nomor; });
    }
    const unpaid = unpaidTx.map((tx: any) => {
      const t = tenantMap[tx.tenant_id];
      return { nama: t?.nama || "-", kamar: t?.room_id ? roomMap[t.room_id] || "-" : "-", sisa: tx.total_tagihan - tx.jumlah_dibayar };
    });
    setUnpaidList(unpaid);
    setTotalUnpaid(unpaid.reduce((s: number, u: any) => s + u.sisa, 0));

    const combined = [
      ...txData.filter((t: any) => t.jumlah_dibayar > 0).map((t: any) => ({ id: t.id, type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)}`, date: t.tanggal_bayar || t.created_at })),
      ...expData.map((e: any) => ({ id: e.id, type: "expense", amount: e.jumlah, label: e.judul, date: e.tanggal, kategori: e.kategori, is_recurring: e.is_recurring })),
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

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); setShowEdit(null); return; }
    if (!showEdit) return;
    const { error } = await supabase.from("expenses").update({ judul, kategori, jumlah: parseInt(jumlah) || 0, tanggal, is_recurring: isRecurring } as any).eq("id", showEdit.id);
    if (error) toast.error(error.message);
    else { toast.success("Pengeluaran diperbarui!"); setShowEdit(null); fetchData(); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    const { error } = await supabase.from("expenses").delete().eq("id", id) as any;
    if (error) toast.error(error.message);
    else { toast.success("Pengeluaran dihapus"); fetchData(); }
  };

  const selisih = pemasukan - pengeluaran;
  const pemasukanDiff = pemasukan - pemasukanLalu;
  const pengeluaranDiff = pengeluaran - pengeluaranLalu;

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
            {/* Summary cards with trends */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card rounded-xl border border-border p-3 text-center shadow-sm">
                <TrendingUp size={18} className="text-[hsl(142,71%,45%)] mx-auto" />
                <p className="text-xs text-muted-foreground mt-1">Pemasukan</p>
                <p className="text-sm font-bold text-foreground">{formatRupiah(pemasukan)}</p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {pemasukanDiff >= 0 ? <TrendingUp size={10} className="text-[hsl(142,71%,45%)]" /> : <TrendingDown size={10} className="text-destructive" />}
                  <span className={`text-[10px] ${pemasukanDiff >= 0 ? "text-[hsl(142,71%,45%)]" : "text-destructive"}`}>
                    {pemasukanDiff >= 0 ? "+" : ""}{formatRupiah(pemasukanDiff)}
                  </span>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 text-center shadow-sm">
                <TrendingDown size={18} className="text-destructive mx-auto" />
                <p className="text-xs text-muted-foreground mt-1">Pengeluaran</p>
                <p className="text-sm font-bold text-foreground">{formatRupiah(pengeluaran)}</p>
                <div className="flex items-center justify-center gap-0.5 mt-1">
                  {pengeluaranDiff <= 0 ? <TrendingDown size={10} className="text-[hsl(142,71%,45%)]" /> : <TrendingUp size={10} className="text-destructive" />}
                  <span className={`text-[10px] ${pengeluaranDiff <= 0 ? "text-[hsl(142,71%,45%)]" : "text-destructive"}`}>
                    {pengeluaranDiff >= 0 ? "+" : ""}{formatRupiah(pengeluaranDiff)}
                  </span>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-3 text-center shadow-sm">
                <Minus size={18} className={`mx-auto ${selisih >= 0 ? "text-[hsl(142,71%,45%)]" : "text-destructive"}`} />
                <p className="text-xs text-muted-foreground mt-1">Selisih</p>
                <p className={`text-sm font-bold ${selisih >= 0 ? "text-[hsl(142,71%,45%)]" : "text-destructive"}`}>{formatRupiah(selisih)}</p>
              </div>
            </div>

            {/* Bar chart - 6 months */}
            {barData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground mb-3">Tren 6 Bulan Terakhir</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                      <XAxis dataKey="bulan" tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 9%, 46%)" tickFormatter={v => `${(v / 1000000).toFixed(1)}jt`} />
                      <Tooltip formatter={(v: number) => formatRupiah(v)} />
                      <Bar dataKey="pemasukan" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Pemasukan" />
                      <Bar dataKey="pengeluaran" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Pengeluaran" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Pie chart - income by room type */}
            {pieData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground mb-3">Pemasukan per Tipe Kamar</p>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={50} dataKey="value" strokeWidth={0} paddingAngle={2}>
                          {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {pieData.map((d, idx) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="text-xs text-muted-foreground">{d.name}: {formatRupiah(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Unpaid section */}
            {unpaidList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-[hsl(38,92%,50%)]" />
                  <p className="text-sm font-semibold text-foreground">Tagihan Belum Lunas</p>
                </div>
                <p className="text-lg font-bold text-destructive mb-3">{formatRupiah(totalUnpaid)}</p>
                <div className="space-y-2">
                  {unpaidList.map((u, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-foreground">{u.nama}</p>
                        <p className="text-xs text-muted-foreground">Kamar {u.kamar}</p>
                      </div>
                      <span className="font-semibold text-destructive">{formatRupiah(u.sisa)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-foreground">Transaksi</h2>
              <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={14} className="mr-1" /> Pengeluaran</Button>
            </div>

            {items.length === 0 ? (
              <EmptyState title="Belum ada transaksi" description="Transaksi akan muncul di sini" />
            ) : (
              <div className="space-y-2">
                {items.map((item, i) => (
                  <motion.div key={item.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="flex items-center bg-card rounded-lg border border-border px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${item.type === "income" ? "bg-[hsl(142,71%,45%)]/10" : "bg-destructive/10"}`}>
                        {item.type === "income" ? <TrendingUp size={14} className="text-[hsl(142,71%,45%)]" /> : <TrendingDown size={14} className="text-destructive" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 text-right ${item.type === "income" ? "text-[hsl(142,71%,45%)]" : "text-destructive"}`}>
                      {item.type === "income" ? "+" : "-"}{formatRupiah(item.amount)}
                    </span>
                    <div className="w-8 flex-shrink-0 flex justify-center">
                      {item.type === "expense" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted">
                              <MoreVertical size={14} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setShowEdit(item);
                              setJudul(item.label);
                              setKategori(item.kategori || "Lainnya");
                              setJumlah(String(item.amount));
                              setTanggal(item.date);
                              setIsRecurring(item.is_recurring || false);
                            }}>
                              <Pencil size={14} className="mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteExpense(item.id)}>
                              <Trash2 size={14} className="mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add expense */}
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

      {/* Edit expense */}
      <BottomSheet open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Pengeluaran">
        <form onSubmit={handleEditExpense} className="space-y-4">
          <div className="space-y-2"><Label>Judul</Label><Input value={judul} onChange={e => setJudul(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Kategori</Label>
            <Select value={kategori} onValueChange={setKategori}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Jumlah (Rp)</Label><Input type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} /></div>
          <div className="flex items-center justify-between"><Label>Pengeluaran Rutin</Label><Switch checked={isRecurring} onCheckedChange={setIsRecurring} /></div>
          <Button type="submit" className="w-full">Simpan Perubahan</Button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
