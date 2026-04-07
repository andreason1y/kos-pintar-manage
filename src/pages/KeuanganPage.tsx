import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah, getMonthName } from "@/lib/helpers";
import { useTransactions, useExpenses, useDeposits, useTenants, useRoomTypesAndRooms, useInvalidate } from "@/hooks/use-queries";
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
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { Plus, TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Download, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import logoIcon from "@/assets/logo-icon.png";

const EXPENSE_CATEGORIES = ["Listrik", "Air/PDAM", "Kebersihan", "Perbaikan/Renovasi", "Keamanan", "Internet/WiFi", "Pajak", "Gaji Penjaga", "Pengembalian Deposit", "Lainnya"];

export default function KeuanganPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const invalidate = useInvalidate();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);

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

  const { data: txData, isLoading: txLoading } = useTransactions();
  const { data: expData, isLoading: expLoading } = useExpenses(bulan, tahun);
  const bulanLalu = bulan === 1 ? 12 : bulan - 1;
  const tahunLalu = bulan === 1 ? tahun - 1 : tahun;
  const { data: expLastData, isLoading: expLastLoading } = useExpenses(bulanLalu, tahunLalu);
  const { data: depositData, isLoading: depLoading } = useDeposits();
  const { data: tenantData } = useTenants();
  const { data: roomData } = useRoomTypesAndRooms();

  const loading = !demo.isDemo && (txLoading || expLoading || depLoading || expLastLoading);

  const propertyName = demo.isDemo ? demo.property.nama_kos : activeProperty?.nama_kos || "";
  const propertyAlamat = demo.isDemo ? demo.property.alamat : activeProperty?.alamat || "";

  // Deposit drawdown list
  const depositList = useMemo(() => {
    if (demo.isDemo) {
      return demo.deposits
        .filter(d => d.status === "ditahan")
        .map(d => {
          const tenant = demo.tenants.find(t => t.id === d.tenant_id);
          const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
          return { tenantId: d.tenant_id, nama: tenant?.nama || "-", kamar: room?.nomor || "-", jumlah: d.jumlah };
        });
    }
    if (!depositData || !tenantData || !roomData) return [];
    return (depositData as any[])
      .filter((d: any) => d.status === "ditahan")
      .map((d: any) => {
        const tenant = (tenantData as any[]).find((t: any) => t.id === d.tenant_id);
        const room = tenant?.room_id ? (roomData.rooms as any[]).find((r: any) => r.id === tenant.room_id) : null;
        return { tenantId: d.tenant_id, nama: tenant?.nama || "-", kamar: room?.nomor || "-", jumlah: d.jumlah };
      });
  }, [demo.isDemo, depositData, tenantData, roomData, demo.deposits, demo.tenants, demo.rooms]);

  const computed = useMemo(() => {
    if (demo.isDemo) {
      const txAll = demo.transactions;
      const txMonth = txAll.filter(t => t.periode_bulan === bulan && t.periode_tahun === tahun);
      const exp = demo.expenses;
      const pemasukan = txMonth.reduce((s, t) => s + t.jumlah_dibayar, 0);
      const pengeluaran = exp.reduce((s, e) => s + e.jumlah, 0);
      const txLalu = txAll.filter(t => t.periode_bulan === bulanLalu && t.periode_tahun === tahunLalu);
      const pemasukanLalu = txLalu.reduce((s, t) => s + t.jumlah_dibayar, 0);

      const bars = [];
      for (let i = 5; i >= 0; i--) {
        let mb = bulan - i, mt = tahun;
        while (mb <= 0) { mb += 12; mt--; }
        const txM = txAll.filter(t => t.periode_bulan === mb && t.periode_tahun === mt);
        bars.push({ bulan: getMonthName(mb).slice(0, 3), pemasukan: txM.reduce((s, t) => s + t.jumlah_dibayar, 0), pengeluaran: i === 0 ? pengeluaran : Math.round(pengeluaran * (0.8 + Math.random() * 0.3)) });
      }

      const pieMap: Record<string, number> = {};
      txMonth.forEach(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
        const rt = room ? demo.roomTypes.find(r => r.id === room.room_type_id) : null;
        pieMap[rt?.nama || "Lainnya"] = (pieMap[rt?.nama || "Lainnya"] || 0) + tx.jumlah_dibayar;
      });

      const unpaid = txMonth.filter(t => t.status !== "lunas").map(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
        return { nama: tenant?.nama || "-", kamar: room?.nomor || "-", sisa: tx.total_tagihan - tx.jumlah_dibayar };
      });

      const items = [
        ...txMonth.filter(t => t.jumlah_dibayar > 0).map(t => ({ id: t.id, type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)}`, date: t.tanggal_bayar || t.created_at })),
        ...exp.map(e => ({ id: e.id, type: "expense", amount: e.jumlah, label: e.judul, date: e.tanggal, kategori: e.kategori, is_recurring: e.is_recurring })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalDep = demo.deposits.filter(d => d.status === "ditahan").reduce((s, d) => s + d.jumlah, 0);

      return {
        pemasukan, pengeluaran, pemasukanLalu, pengeluaranLalu: pengeluaran * 0.9,
        barData: bars,
        pieData: Object.entries(pieMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
        unpaidList: unpaid, totalUnpaid: unpaid.reduce((s, u) => s + u.sisa, 0),
        totalDeposit: totalDep,
        items,
      };
    }

    if (!txData || !expData) return null;

    const txMonth = txData.filter((t: any) => t.periode_bulan === bulan && t.periode_tahun === tahun);
    const txLast = txData.filter((t: any) => t.periode_bulan === bulanLalu && t.periode_tahun === tahunLalu);
    const pemasukan = txMonth.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0);
    const pengeluaran = expData.reduce((s: number, e: any) => s + (e.jumlah || 0), 0);
    const pemasukanLalu = txLast.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0);
    const pengeluaranLalu = (expLastData || []).reduce((s: number, e: any) => s + (e.jumlah || 0), 0);

    const unpaidTx = txMonth.filter((t: any) => t.status !== "lunas");
    const tenants = tenantData || [];
    const rooms = roomData?.rooms || [];
    const rTypes = roomData?.roomTypes || [];
    const tenantMap: Record<string, any> = {};
    (tenants as any[]).forEach((t: any) => { tenantMap[t.id] = t; });
    const roomMap: Record<string, any> = {};
    (rooms as any[]).forEach((r: any) => { roomMap[r.id] = r; });
    const rtMap: Record<string, string> = {};
    (rTypes as any[]).forEach((rt: any) => { rtMap[rt.id] = rt.nama; });

    const unpaid = unpaidTx.map((tx: any) => {
      const t = tenantMap[tx.tenant_id];
      return { nama: t?.nama || "-", kamar: t?.room_id ? roomMap[t.room_id]?.nomor || "-" : "-", sisa: tx.total_tagihan - tx.jumlah_dibayar };
    });

    const bars = [];
    for (let i = 5; i >= 0; i--) {
      let mb = bulan - i, mt = tahun;
      while (mb <= 0) { mb += 12; mt--; }
      const txM = txData.filter((t: any) => t.periode_bulan === mb && t.periode_tahun === mt);
      const inc = txM.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0);
      const exp = i === 0 ? pengeluaran : (pengeluaranLalu > 0 ? pengeluaranLalu : pengeluaran);
      bars.push({ bulan: getMonthName(mb).slice(0, 3), pemasukan: inc, pengeluaran: exp });
    }

    const pieMap: Record<string, number> = {};
    txMonth.forEach((tx: any) => {
      const t = tenantMap[tx.tenant_id];
      const room = t?.room_id ? roomMap[t.room_id] : null;
      const rtName = room ? rtMap[room.room_type_id] || "Lainnya" : "Lainnya";
      pieMap[rtName] = (pieMap[rtName] || 0) + (tx.jumlah_dibayar || 0);
    });

    const totalDep = (depositData || []).filter((d: any) => d.status === "ditahan").reduce((s: number, d: any) => s + (d.jumlah || 0), 0);

    const items = [
      ...txMonth.filter((t: any) => t.jumlah_dibayar > 0).map((t: any) => ({ id: t.id, type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)}`, date: t.tanggal_bayar || t.created_at })),
      ...expData.map((e: any) => ({ id: e.id, type: "expense", amount: e.jumlah, label: e.judul, date: e.tanggal, kategori: e.kategori, is_recurring: e.is_recurring })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      pemasukan, pengeluaran, pemasukanLalu, pengeluaranLalu,
      barData: bars,
      pieData: Object.entries(pieMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
      unpaidList: unpaid, totalUnpaid: unpaid.reduce((s: number, u: any) => s + u.sisa, 0),
      totalDeposit: totalDep,
      items,
    };
  }, [demo.isDemo, txData, expData, expLastData, depositData, tenantData, roomData, bulan, tahun]);

  const refetch = () => { invalidate.all(); };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demo.isDemo) {
      demo.addExpense({ property_id: "prop-1", judul, kategori, jumlah: parseInt(jumlah) || 0, tanggal, is_recurring: isRecurring });
      toast.success("Pengeluaran ditambahkan!"); setShowAdd(false); setJudul(""); setJumlah("");
      return;
    }
    if (!activeProperty) return;
    const { error } = await supabase.from("expenses").insert({ property_id: activeProperty.id, judul, kategori, jumlah: parseInt(jumlah) || 0, tanggal, is_recurring: isRecurring } as any);
    if (error) toast.error(error.message);
    else { toast.success("Pengeluaran ditambahkan!"); setShowAdd(false); setJudul(""); setJumlah(""); refetch(); }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    if (demo.isDemo) {
      demo.updateExpense(showEdit.id, { judul, kategori, jumlah: parseInt(jumlah) || 0, tanggal, is_recurring: isRecurring });
      toast.success("Pengeluaran diperbarui!"); setShowEdit(null);
      return;
    }
    const { error } = await supabase.from("expenses").update({ judul, kategori, jumlah: parseInt(jumlah) || 0, tanggal, is_recurring: isRecurring } as any).eq("id", showEdit.id);
    if (error) toast.error(error.message);
    else { toast.success("Pengeluaran diperbarui!"); setShowEdit(null); refetch(); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (demo.isDemo) {
      demo.deleteExpense(id);
      toast.success("Pengeluaran dihapus");
      return;
    }
    const { error } = await supabase.from("expenses").delete().eq("id", id) as any;
    if (error) toast.error(error.message);
    else { toast.success("Pengeluaran dihapus"); refetch(); }
  };

  const handleExportPDF = async () => {
    if (!computed) return;
    const { default: html2pdf } = await import("html2pdf.js");

    const { pemasukan, pengeluaran, totalDeposit, items } = computed;
    const laba = pemasukan - pengeluaran;

    const incomeItems = items.filter((i: any) => i.type === "income");
    const expenseItems = items.filter((i: any) => i.type === "expense");
    const expByKategori: Record<string, any[]> = {};
    expenseItems.forEach((e: any) => {
      const k = e.kategori || "Lainnya";
      if (!expByKategori[k]) expByKategori[k] = [];
      expByKategori[k].push(e);
    });

    const html = `
      <div style="font-family:sans-serif;padding:20px;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="text-align:center;margin-bottom:20px">
          <h2 style="margin:0;font-size:18px">Laporan Keuangan</h2>
          <p style="margin:4px 0;font-size:14px;font-weight:bold">${propertyName}</p>
          ${propertyAlamat ? `<p style="margin:2px 0;font-size:12px;color:#666">${propertyAlamat}</p>` : ""}
          <p style="margin:2px 0;font-size:12px;color:#666">${getMonthName(bulan)} ${tahun}</p>
        </div>
        <hr style="border:1px solid #ddd"/>
        <h3 style="font-size:14px;margin:16px 0 8px">Ringkasan</h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse">
          <tr><td style="padding:4px 0">Pemasukan</td><td style="text-align:right;color:green">${formatRupiah(pemasukan)}</td></tr>
          <tr><td style="padding:4px 0">Pengeluaran</td><td style="text-align:right;color:red">${formatRupiah(pengeluaran)}</td></tr>
          <tr style="border-top:1px solid #ddd"><td style="padding:6px 0;font-weight:bold">Laba Bersih</td><td style="text-align:right;font-weight:bold;color:${laba >= 0 ? 'green' : 'red'}">${formatRupiah(laba)}</td></tr>
          ${totalDeposit > 0 ? `<tr><td style="padding:4px 0;color:#666">Deposit Ditahan</td><td style="text-align:right;color:#666">${formatRupiah(totalDeposit)}</td></tr>` : ""}
        </table>
        ${incomeItems.length > 0 ? `
          <h3 style="font-size:14px;margin:16px 0 8px">Pemasukan</h3>
          <table style="width:100%;font-size:12px;border-collapse:collapse">
            ${incomeItems.map((i: any) => `<tr><td style="padding:3px 0">${i.label}</td><td style="text-align:right;color:green">+${formatRupiah(i.amount)}</td></tr>`).join("")}
          </table>
        ` : ""}
        ${Object.keys(expByKategori).length > 0 ? `
          <h3 style="font-size:14px;margin:16px 0 8px">Pengeluaran</h3>
          ${Object.entries(expByKategori).map(([k, items]) => `
            <p style="font-size:12px;font-weight:bold;margin:10px 0 4px;color:#555">${k}</p>
            <table style="width:100%;font-size:12px;border-collapse:collapse">
              ${items.map((i: any) => `<tr><td style="padding:3px 0">${i.label}</td><td style="text-align:right;color:red">-${formatRupiah(i.amount)}</td></tr>`).join("")}
            </table>
          `).join("")}
        ` : ""}
        <hr style="border:1px solid #ddd;margin:16px 0"/>
        <p style="text-align:center;font-size:10px;color:#999">Dibuat oleh KosPintar · ${new Date().toLocaleDateString("id-ID")}</p>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const sanitizedName = propertyName.replace(/[^a-zA-Z0-9]/g, "-");
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `Laporan-Keuangan-${sanitizedName}-${getMonthName(bulan)}-${tahun}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(container).save();

    document.body.removeChild(container);
    toast.success("PDF berhasil diunduh!");
  };

  if (!computed) return <AppShell><PageHeader title="Keuangan" /><div className="px-4 space-y-3"><SkeletonCard lines={2} /><SkeletonCard /><SkeletonCard /></div></AppShell>;

  const { pemasukan, pengeluaran, pemasukanLalu, pengeluaranLalu, barData, pieData, unpaidList, totalUnpaid, totalDeposit, items } = computed;
  const selisih = pemasukan - pengeluaran;
  const pemasukanDiff = pemasukan - pemasukanLalu;
  const pengeluaranDiff = pengeluaran - (pengeluaranLalu as number);

  return (
    <AppShell>
      <PageHeader title="Keuangan" subtitle={`${getMonthName(bulan)} ${tahun}`} action={
        <Button size="sm" variant="outline" onClick={handleExportPDF}>
          <Download size={14} className="mr-1" /> Export PDF
        </Button>
      } />
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

            {barData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
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

            {pieData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.15 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <p className="text-sm font-semibold text-foreground mb-3">Pemasukan per Tipe Kamar</p>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={50} dataKey="value" strokeWidth={0} paddingAngle={2}>
                          {pieData.map((_: any, idx: number) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5">
                    {pieData.map((d: any, idx: number) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="text-xs text-muted-foreground">{d.name}: {formatRupiah(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {unpaidList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.15 }} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-[hsl(38,92%,50%)]" />
                  <p className="text-sm font-semibold text-foreground">Tagihan Belum Lunas</p>
                </div>
                <p className="text-lg font-bold text-destructive mb-3">{formatRupiah(totalUnpaid)}</p>
                <div className="space-y-2">
                  {unpaidList.map((u: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div><p className="font-medium text-foreground">{u.nama}</p><p className="text-xs text-muted-foreground">Kamar {u.kamar}</p></div>
                      <span className="font-semibold text-destructive">{formatRupiah(u.sisa)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Deposit Ditahan — tappable with drawdown list */}
            {totalDeposit > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.15 }}>
                <button
                  onClick={() => setDepositOpen(!depositOpen)}
                  className="w-full bg-card rounded-xl border border-border p-4 shadow-sm text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-primary" />
                      <p className="text-sm font-semibold text-foreground">Deposit Ditahan</p>
                    </div>
                    {depositOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                  <p className="text-lg font-bold text-primary mt-1">{formatRupiah(totalDeposit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total deposit dari semua penyewa aktif (bukan termasuk pemasukan)</p>
                </button>
                <AnimatePresence>
                  {depositOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-card rounded-b-xl border border-t-0 border-border px-4 pb-4 shadow-sm overflow-hidden"
                    >
                      <div className="space-y-2 pt-2">
                        {depositList.map((d, i) => (
                          <div key={i} className="flex justify-between items-center text-sm py-1">
                            <div>
                              <p className="font-medium text-foreground">{d.nama}</p>
                              <p className="text-xs text-muted-foreground">Kamar {d.kamar}</p>
                            </div>
                            <span className="font-semibold text-primary">{formatRupiah(d.jumlah)}</span>
                          </div>
                        ))}
                        <div className="border-t border-border pt-2 flex justify-between items-center text-sm">
                          <span className="font-semibold text-foreground">Total</span>
                          <span className="font-bold text-primary">{formatRupiah(totalDeposit)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                {items.map((item: any, i: number) => {
                  const rowContent = (
                    <div className="flex items-center px-4 py-3 border border-border rounded-lg shadow-sm">
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
                    </div>
                  );

                  if (item.type === "expense") {
                    return (
                      <motion.div key={item.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02, duration: 0.15 }}>
                        <SwipeableRow
                          onEdit={() => { setShowEdit(item); setJudul(item.label); setKategori(item.kategori || "Lainnya"); setJumlah(String(item.amount)); setTanggal(item.date); setIsRecurring(item.is_recurring || false); }}
                          onDelete={() => setDeleteTarget({ id: item.id, name: item.label })}
                        >{rowContent}</SwipeableRow>
                      </motion.div>
                    );
                  }
                  return <motion.div key={item.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02, duration: 0.15 }}>{rowContent}</motion.div>;
                })}
              </div>
            )}
          </>
        )}
      </div>

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Pengeluaran">
        <form onSubmit={handleAddExpense} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Judul</Label><Input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Bayar listrik" required /></div>
            <div className="space-y-2"><Label>Kategori</Label>
            <Select value={kategori} onValueChange={setKategori}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Jumlah (Rp)</Label><Input type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} /></div>
          <div className="flex items-center justify-between"><Label>Pengeluaran Rutin</Label><Switch checked={isRecurring} onCheckedChange={setIsRecurring} /></div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Simpan Pengeluaran</Button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Pengeluaran">
        <form onSubmit={handleEditExpense} className="bottom-sheet-form">
          <div className="bottom-sheet-body">
            <div className="space-y-2"><Label>Judul</Label><Input value={judul} onChange={e => setJudul(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Kategori</Label>
            <Select value={kategori} onValueChange={setKategori}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
              {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>Jumlah (Rp)</Label><Input type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} /></div>
          <div className="flex items-center justify-between"><Label>Pengeluaran Rutin</Label><Switch checked={isRecurring} onCheckedChange={setIsRecurring} /></div>
          </div>
          <div className="bottom-sheet-footer">
            <Button type="submit" className="w-full">Simpan Pengeluaran</Button>
          </div>
        </form>
      </BottomSheet>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDeleteExpense(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.name || ""}
      />
    </AppShell>
  );
}
