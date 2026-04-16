import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah, formatRupiahCompact, getMonthName } from "@/lib/helpers";
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
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
  const pendingActionRef = useRef<string | null>(null);

  // Handle URL action params from dashboard quick actions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    if (action) {
      pendingActionRef.current = action;
      window.history.replaceState({}, "", window.location.pathname);
      if (action === "add-expense") {
        setShowAdd(true);
      }
    }
  }, []);

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

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
      const seen = new Set<string>();
      return demo.deposits
        .filter(d => {
          if (d.status !== "ditahan") return false;
          const tenant = demo.tenants.find(t => t.id === d.tenant_id);
          if (!tenant || tenant.tanggal_keluar != null) return false;
          if (seen.has(d.id)) return false;
          seen.add(d.id);
          return true;
        })
        .map(d => {
          const tenant = demo.tenants.find(t => t.id === d.tenant_id);
          const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
          return { id: d.id, tenantId: d.tenant_id, nama: tenant?.nama || "-", kamar: room?.nomor || "-", jumlah: d.jumlah };
        });
    }
    if (!depositData || !tenantData || !roomData) return [];
    const seen = new Set<string>();
    return (depositData as any[])
      .filter((d: any) => {
        if (d.status !== "ditahan") return false;
        const tenant = (tenantData as any[]).find((t: any) => t.id === d.tenant_id);
        if (!tenant || tenant.tanggal_keluar != null) return false;
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      })
      .map((d: any) => {
        const tenant = (tenantData as any[]).find((t: any) => t.id === d.tenant_id);
        const room = tenant?.room_id ? (roomData.rooms as any[]).find((r: any) => r.id === tenant.room_id) : null;
        return { id: d.id, tenantId: d.tenant_id, nama: tenant?.nama || "-", kamar: room?.nomor || "-", jumlah: d.jumlah };
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

      const unpaid = txMonth.filter(t => t.total_tagihan - t.jumlah_dibayar > 0).map(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
        return { nama: tenant?.nama || "-", kamar: room?.nomor || "-", sisa: tx.total_tagihan - tx.jumlah_dibayar };
      });

      const items = [
        ...txMonth.filter(t => t.jumlah_dibayar > 0).map(t => ({ id: t.id, type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)}`, date: t.tanggal_bayar || t.created_at })),
        ...exp.map(e => ({ id: e.id, type: "expense", amount: e.jumlah, label: e.judul, date: e.tanggal, kategori: e.kategori, is_recurring: e.is_recurring })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalDep = demo.deposits.filter(d => d.status === "ditahan" && demo.tenants.some(t => t.id === d.tenant_id && t.tanggal_keluar == null)).reduce((s, d) => s + d.jumlah, 0);

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

    const unpaidTx = txMonth.filter((t: any) => t.total_tagihan - t.jumlah_dibayar > 0);
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

    const seenDepIds = new Set<string>();
    const totalDep = (depositData || []).filter((d: any) => {
      if (d.status !== "ditahan") return false;
      const tenant = (tenants as any[]).find((t: any) => t.id === d.tenant_id);
      if (!tenant || tenant.tanggal_keluar != null) return false;
      if (seenDepIds.has(d.id)) return false;
      seenDepIds.add(d.id);
      return true;
    }).reduce((s: number, d: any) => s + (d.jumlah || 0), 0);

    const items = [
      ...txMonth.filter((t: any) => t.jumlah_dibayar > 0).map((t: any) => {
        const tenant = tenantMap[t.tenant_id];
        return { id: t.id, type: "income", amount: t.jumlah_dibayar, label: `Sewa ${getMonthName(t.periode_bulan)} - ${tenant?.nama || "-"}`, date: t.tanggal_bayar || t.created_at };
      }),
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

    // Build tenant+room info for income items
    const incomeRows = incomeItems.map((item: any) => {
      let tenantName = "-";
      let roomNo = "-";
      if (demo.isDemo) {
        const tx = demo.transactions.find(t => t.id === item.id);
        if (tx) {
          const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
          tenantName = tenant?.nama || "-";
          const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
          roomNo = room?.nomor || "-";
        }
      } else if (txData && tenantData && roomData) {
        const tx = (txData as any[]).find((t: any) => t.id === item.id);
        if (tx) {
          const tenant = (tenantData as any[]).find((t: any) => t.id === tx.tenant_id);
          tenantName = tenant?.nama || "-";
          const room = tenant?.room_id ? (roomData.rooms as any[]).find((r: any) => r.id === tenant.room_id) : null;
          roomNo = room?.nomor || "-";
        }
      }
      return { date: item.date, label: item.label, tenantName, roomNo, amount: item.amount };
    });

    const expByKategori: Record<string, { label: string; date: string; amount: number }[]> = {};
    expenseItems.forEach((e: any) => {
      const k = e.kategori || "Lainnya";
      if (!expByKategori[k]) expByKategori[k] = [];
      expByKategori[k].push(e);
    });

    const totalPengeluaran = expenseItems.reduce((s: number, e: any) => s + e.amount, 0);
    const generateDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;padding:32px 28px;max-width:720px;margin:0 auto;color:#1a1a2e;font-size:13px;line-height:1.5">
        <!-- Header -->
        <table style="width:100%;margin-bottom:12px"><tr>
          <td style="width:50px;vertical-align:top"><img src="${window.location.origin}/logo-icon.png" style="width:40px;height:40px;border-radius:8px" onerror="this.style.display='none'" /></td>
          <td style="vertical-align:top;padding-left:8px">
            <div style="font-size:10px;color:#0d9488;font-weight:700;letter-spacing:1px">KOSPINTAR</div>
          </td>
          <td style="text-align:right;vertical-align:top">
            <div style="font-size:16px;font-weight:700;color:#1a1a2e">${propertyName}</div>
            ${propertyAlamat ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${propertyAlamat}</div>` : ""}
            <div style="font-size:12px;color:#0d9488;font-weight:600;margin-top:4px">${getMonthName(bulan)} ${tahun}</div>
          </td>
        </tr></table>
        <div style="height:2px;background:linear-gradient(90deg,#0d9488,#14b8a6,#99f6e4);border-radius:2px;margin-bottom:20px"></div>

        <div style="font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:12px">LAPORAN KEUANGAN</div>

        <!-- Summary Box -->
        <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:10px;padding:16px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="width:33%;text-align:center;padding:4px">
                <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Pemasukan</div>
                <div style="font-size:16px;font-weight:700;color:#16a34a;margin-top:4px">${formatRupiah(pemasukan)}</div>
              </td>
              <td style="width:33%;text-align:center;padding:4px;border-left:1px solid #d1fae5;border-right:1px solid #d1fae5">
                <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Pengeluaran</div>
                <div style="font-size:16px;font-weight:700;color:#dc2626;margin-top:4px">${formatRupiah(pengeluaran)}</div>
              </td>
              <td style="width:33%;text-align:center;padding:4px">
                <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Laba Bersih</div>
                <div style="font-size:16px;font-weight:700;color:#0d9488;margin-top:4px">${formatRupiah(laba)}</div>
              </td>
            </tr>
          </table>
          ${totalDeposit > 0 ? `
            <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #99f6e4;text-align:center">
              <span style="font-size:11px;color:#6b7280">Deposit Ditahan: </span>
              <span style="font-size:12px;font-weight:600;color:#6b7280">${formatRupiah(totalDeposit)}</span>
            </div>
          ` : ""}
        </div>

        <!-- Pemasukan Table -->
        ${incomeRows.length > 0 ? `
          <div style="font-size:13px;font-weight:700;color:#16a34a;margin-bottom:8px;display:flex;align-items:center">
            <span style="display:inline-block;width:4px;height:16px;background:#16a34a;border-radius:2px;margin-right:8px"></span>
            PEMASUKAN
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px">
            <tr style="background:#f9fafb">
              <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Tanggal</th>
              <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Keterangan</th>
              <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Penyewa</th>
              <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Kamar</th>
              <th style="text-align:right;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Jumlah</th>
            </tr>
            ${incomeRows.map((r: any, i: number) => `
              <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"}">
                <td style="padding:6px;border-bottom:1px solid #f3f4f6">${formatDate(r.date)}</td>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6">${r.label}</td>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6">${r.tenantName}</td>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6">${r.roomNo}</td>
                <td style="padding:6px;border-bottom:1px solid #f3f4f6;text-align:right;color:#16a34a;font-weight:600">${formatRupiah(r.amount)}</td>
              </tr>
            `).join("")}
            <tr style="background:#f0fdf4">
              <td colspan="4" style="padding:8px 6px;font-weight:700;border-top:2px solid #bbf7d0">Total Pemasukan</td>
              <td style="padding:8px 6px;text-align:right;font-weight:700;color:#16a34a;border-top:2px solid #bbf7d0">${formatRupiah(pemasukan)}</td>
            </tr>
          </table>
        ` : ""}

        <!-- Pengeluaran Table -->
        ${Object.keys(expByKategori).length > 0 ? `
          <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:8px;display:flex;align-items:center">
            <span style="display:inline-block;width:4px;height:16px;background:#dc2626;border-radius:2px;margin-right:8px"></span>
            PENGELUARAN
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px">
            <tr style="background:#f9fafb">
              <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Tanggal</th>
              <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Keterangan</th>
              <th style="text-align:left;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Kategori</th>
              <th style="text-align:right;padding:8px 6px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;font-size:10px;text-transform:uppercase">Jumlah</th>
            </tr>
            ${Object.entries(expByKategori).map(([kat, items]) => {
              const subtotal = items.reduce((s: number, e: any) => s + e.amount, 0);
              return `
                ${items.map((e: any, i: number) => `
                  <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"}">
                    <td style="padding:6px;border-bottom:1px solid #f3f4f6">${formatDate(e.date)}</td>
                    <td style="padding:6px;border-bottom:1px solid #f3f4f6">${e.label}</td>
                    <td style="padding:6px;border-bottom:1px solid #f3f4f6">${kat}</td>
                    <td style="padding:6px;border-bottom:1px solid #f3f4f6;text-align:right;color:#dc2626;font-weight:500">${formatRupiah(e.amount)}</td>
                  </tr>
                `).join("")}
                <tr style="background:#fef2f2">
                  <td colspan="3" style="padding:6px;font-weight:600;font-size:11px;color:#6b7280;border-bottom:1px solid #fecaca">Subtotal ${kat}</td>
                  <td style="padding:6px;text-align:right;font-weight:600;color:#dc2626;font-size:11px;border-bottom:1px solid #fecaca">${formatRupiah(subtotal)}</td>
                </tr>
              `;
            }).join("")}
            <tr style="background:#fef2f2">
              <td colspan="3" style="padding:8px 6px;font-weight:700;border-top:2px solid #fca5a5">Total Pengeluaran</td>
              <td style="padding:8px 6px;text-align:right;font-weight:700;color:#dc2626;border-top:2px solid #fca5a5">${formatRupiah(totalPengeluaran)}</td>
            </tr>
          </table>
        ` : ""}

        <!-- Footer -->
        <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center">
          <div style="font-size:10px;color:#9ca3af">Dibuat oleh KosPintar · kospintar.id · ${generateDate}</div>
        </div>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    // Copy logo to public for PDF access
    const sanitizedName = propertyName.replace(/[^a-zA-Z0-9]/g, "-");
    await html2pdf().set({
      margin: [12, 12, 12, 12],
      filename: `Laporan-Keuangan-${sanitizedName}-${getMonthName(bulan)}-${tahun}.pdf`,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(container).save();

    document.body.removeChild(container);
    toast.success("PDF berhasil diunduh!");
  };

  // Auto-trigger export PDF from dashboard quick action
  useEffect(() => {
    if (pendingActionRef.current === "export-pdf" && computed) {
      pendingActionRef.current = null;
      handleExportPDF();
    }
  }, [computed]);

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
                <p className="text-sm font-bold text-foreground">{formatRupiahCompact(pemasukan)}</p>
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
                <p className="text-sm font-bold text-foreground">{formatRupiahCompact(pengeluaran)}</p>
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
                <p className={`text-sm font-bold ${selisih >= 0 ? "text-[hsl(142,71%,45%)]" : "text-destructive"}`}>{formatRupiahCompact(selisih)}</p>
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
                        <div className="grid grid-cols-2 gap-2 w-full text-xs text-muted-foreground">
                          <span>{d.name}</span>
                          <span className="text-right">{formatRupiahCompact(d.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {unpaidList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.15 }}>
                <Collapsible defaultOpen={false} className="bg-card rounded-xl border border-border shadow-sm">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[hsl(38,92%,50%)]" />
                      <p className="text-sm font-semibold text-foreground">Tagihan Belum Lunas</p>
                    </div>
                    <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:collapse data-[state=open]:expand px-4 pb-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
                  </CollapsibleContent>
                </Collapsible>
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
                        {depositList.map((d) => (
                          <div key={d.id} className="flex justify-between items-center text-sm py-1">
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

            <Collapsible defaultOpen={false} className="bg-card rounded-xl border border-border shadow-sm">
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between rounded-t-xl">
                <h2 className="text-sm font-semibold text-foreground">Transaksi ({items.length} item{items.length !== 1 ? 's' : ''})</h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowAdd(true); }}><Plus size={14} className="mr-1" /> Pengeluaran</Button>
                  <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:collapse data-[state=open]:expand px-4 pb-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
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
                                <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
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
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
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
