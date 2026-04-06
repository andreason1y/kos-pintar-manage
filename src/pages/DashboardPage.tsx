import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah, getMonthName } from "@/lib/helpers";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import {
  Users, DoorOpen, DoorClosed, AlertTriangle,
  UserPlus, CreditCard, Send, Receipt, LayoutGrid, FileText,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalPenyewa: number;
  kamarTerisi: number;
  kamarKosong: number;
  tagihanBelumLunas: number;
  pemasukanBulanIni: number;
  pengeluaranBulanIni: number;
  pemasukanBulanLalu: number;
  pengeluaranBulanLalu: number;
}

const now = new Date();
const bulanIni = now.getMonth() + 1;
const tahunIni = now.getFullYear();

export default function DashboardPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (demo.isDemo) {
      const activeTenants = demo.tenants.filter(t => t.status === "aktif");
      const terisi = demo.rooms.filter(r => r.status === "terisi").length;
      const kosong = demo.rooms.filter(r => r.status === "kosong").length;
      const txBulanIni = demo.transactions.filter(t => t.periode_bulan === bulanIni && t.periode_tahun === tahunIni);
      const txBulanLalu = demo.transactions.filter(t => {
        const bl = bulanIni === 1 ? 12 : bulanIni - 1;
        const tl = bulanIni === 1 ? tahunIni - 1 : tahunIni;
        return t.periode_bulan === bl && t.periode_tahun === tl;
      });
      const expBulanIni = demo.expenses;
      const pemasukan = txBulanIni.reduce((s, t) => s + t.jumlah_dibayar, 0);
      const pengeluaran = expBulanIni.reduce((s, e) => s + e.jumlah, 0);
      const pemasukanLalu = txBulanLalu.reduce((s, t) => s + t.jumlah_dibayar, 0);

      setStats({
        totalPenyewa: activeTenants.length,
        kamarTerisi: terisi,
        kamarKosong: kosong,
        tagihanBelumLunas: txBulanIni.filter(t => t.status !== "lunas").length,
        pemasukanBulanIni: pemasukan,
        pengeluaranBulanIni: pengeluaran,
        pemasukanBulanLalu: pemasukanLalu,
        pengeluaranBulanLalu: pengeluaran * 0.9,
      });
      setLoading(false);
      return;
    }

    if (!activeProperty) return;
    const pid = activeProperty.id;
    setLoading(true);

    const fetchStats = async () => {
      const { data: roomTypes } = await supabase.from("room_types").select("id").eq("property_id", pid) as any;
      const rtIds = (roomTypes || []).map((rt: any) => rt.id);
      let allRooms: any[] = [];
      if (rtIds.length > 0) {
        const { data } = await supabase.from("rooms").select("id, status").in("room_type_id", rtIds) as any;
        allRooms = data || [];
      }

      const [tenants, txThisMonth, txLastMonth, expenses] = await Promise.all([
        supabase.from("tenants").select("id, status").eq("property_id", pid) as any,
        supabase.from("transactions").select("*").eq("property_id", pid).eq("periode_bulan", bulanIni).eq("periode_tahun", tahunIni) as any,
        supabase.from("transactions").select("jumlah_dibayar").eq("property_id", pid)
          .eq("periode_bulan", bulanIni === 1 ? 12 : bulanIni - 1)
          .eq("periode_tahun", bulanIni === 1 ? tahunIni - 1 : tahunIni) as any,
        supabase.from("expenses").select("jumlah").eq("property_id", pid)
          .gte("tanggal", `${tahunIni}-${String(bulanIni).padStart(2, "0")}-01`)
          .lt("tanggal", `${bulanIni === 12 ? tahunIni + 1 : tahunIni}-${String(bulanIni === 12 ? 1 : bulanIni + 1).padStart(2, "0")}-01`) as any,
      ]);

      const tenantData = (tenants.data || []) as any[];
      const txData = (txThisMonth.data || []) as any[];
      const txLastData = (txLastMonth.data || []) as any[];
      const expData = (expenses.data || []) as any[];

      const pemasukan = txData.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0);
      const pengeluaran = expData.reduce((s: number, e: any) => s + (e.jumlah || 0), 0);

      setStats({
        totalPenyewa: tenantData.filter((t: any) => t.status === "aktif").length,
        kamarTerisi: allRooms.filter((r: any) => r.status === "terisi").length,
        kamarKosong: allRooms.filter((r: any) => r.status === "kosong").length,
        tagihanBelumLunas: txData.filter((t: any) => t.status !== "lunas").length,
        pemasukanBulanIni: pemasukan,
        pengeluaranBulanIni: pengeluaran,
        pemasukanBulanLalu: txLastData.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0),
        pengeluaranBulanLalu: 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, [activeProperty, demo.isDemo]);

  const quickActions = [
    { icon: UserPlus, label: "Tambah Penyewa", path: "/penyewa" },
    { icon: CreditCard, label: "Pembayaran", path: "/pembayaran" },
    { icon: Send, label: "Kirim Tagihan", path: "/penyewa" },
    { icon: Receipt, label: "Pengeluaran", path: "/keuangan" },
    { icon: LayoutGrid, label: "Daftar Kamar", path: "/kamar" },
    { icon: FileText, label: "Laporan", path: "/keuangan" },
  ];

  const laba = stats ? stats.pemasukanBulanIni - stats.pengeluaranBulanIni : 0;
  const labaBulanLalu = stats ? stats.pemasukanBulanLalu - (stats.pengeluaranBulanLalu || 0) : 0;
  const labaDiff = laba - labaBulanLalu;

  const propertyName = demo.isDemo ? demo.property.nama_kos : activeProperty?.nama_kos || "Dashboard";

  return (
    <AppShell>
      <PageHeader
        title={propertyName}
        subtitle={`${getMonthName(bulanIni)} ${tahunIni}`}
      />

      <div className="px-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard lines={2} />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Laba Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="gradient-primary rounded-xl p-5 text-primary-foreground"
            >
              <p className="text-sm opacity-80">Laba Bulan Ini</p>
              <p className="text-2xl font-bold mt-1">{formatRupiah(laba)}</p>
              <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                {labaDiff >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{labaDiff >= 0 ? "+" : ""}{formatRupiah(labaDiff)} dari bulan lalu</span>
              </div>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users, label: "Total Penyewa", value: stats.totalPenyewa, color: "text-primary" },
                { icon: DoorOpen, label: "Kamar Terisi", value: stats.kamarTerisi, color: "text-success" },
                { icon: DoorClosed, label: "Kamar Kosong", value: stats.kamarKosong, color: "text-muted-foreground" },
                { icon: AlertTriangle, label: "Belum Lunas", value: stats.tagihanBelumLunas, color: "text-warning" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <stat.icon size={20} className={stat.color} />
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Aksi Cepat</h2>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <action.icon size={18} className="text-primary" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
