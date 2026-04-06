import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah, getMonthName, waTagihanLink } from "@/lib/helpers";
import { useRoomTypesAndRooms, useTenants, useTransactions, useExpenses, usePrefetchRoutes } from "@/hooks/use-queries";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import NotificationBell from "@/components/NotificationBell";
import SkeletonCard from "@/components/SkeletonCard";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import {
  Users, DoorOpen, DoorClosed, AlertTriangle,
  UserPlus, CreditCard, Send, Receipt, LayoutGrid, FileText,
  TrendingUp, TrendingDown, MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalPenyewa: number;
  kamarTerisi: number;
  kamarKosong: number;
  tagihanBelumLunas: number;
  pemasukanBulanIni: number;
  pengeluaranBulanIni: number;
  pemasukanBulanLalu: number;
  pengeluaranBulanLalu: number;
  totalTxBulanIni: number;
  lunasBulanIni: number;
}

interface UnpaidTenant {
  nama: string;
  no_hp: string | null;
  kamar: string;
  sisa: number;
  periodLabel: string;
}

const now = new Date();
const bulanIni = now.getMonth() + 1;
const tahunIni = now.getFullYear();
const bulanLalu = bulanIni === 1 ? 12 : bulanIni - 1;
const tahunLalu = bulanIni === 1 ? tahunIni - 1 : tahunIni;

export default function DashboardPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const navigate = useNavigate();
  const [showTagihan, setShowTagihan] = useState(false);

  // Prefetch other routes
  const prefetch = usePrefetchRoutes();
  useEffect(() => { prefetch(); }, [activeProperty]);

  // React Query hooks
  const { data: roomData, isLoading: roomsLoading } = useRoomTypesAndRooms();
  const { data: tenantData, isLoading: tenantsLoading } = useTenants();
  const { data: txData, isLoading: txLoading } = useTransactions();
  const { data: expData, isLoading: expLoading } = useExpenses(bulanIni, tahunIni);
  const { data: expLastData, isLoading: expLastLoading } = useExpenses(bulanLalu, tahunLalu);

  const loading = !demo.isDemo && (roomsLoading || tenantsLoading || txLoading || expLoading || expLastLoading);

  const { stats, unpaidTenants } = useMemo(() => {
    if (demo.isDemo) {
      const activeTenants = demo.tenants.filter(t => t.status === "aktif");
      const terisi = demo.rooms.filter(r => r.status === "terisi").length;
      const kosong = demo.rooms.filter(r => r.status === "kosong").length;
      const txBulanIni = demo.transactions.filter(t => t.periode_bulan === bulanIni && t.periode_tahun === tahunIni);
      const txBulanLalu = demo.transactions.filter(t => t.periode_bulan === bulanLalu && t.periode_tahun === tahunLalu);
      const expBulanIni = demo.expenses;
      const pemasukan = txBulanIni.reduce((s, t) => s + t.jumlah_dibayar, 0);
      const pengeluaran = expBulanIni.reduce((s, e) => s + e.jumlah, 0);
      const pemasukanLalu = txBulanLalu.reduce((s, t) => s + t.jumlah_dibayar, 0);

      const unpaid: UnpaidTenant[] = txBulanIni
        .filter(tx => tx.status !== "lunas")
        .map(tx => {
          const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
          const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
          return {
            nama: tenant?.nama || "-",
            no_hp: tenant?.no_hp || null,
            kamar: room?.nomor || "-",
            sisa: tx.total_tagihan - tx.jumlah_dibayar,
            periodLabel: `${getMonthName(tx.periode_bulan)} ${tx.periode_tahun}`,
          };
        });

      return {
        stats: {
          totalPenyewa: activeTenants.length,
          kamarTerisi: terisi,
          kamarKosong: kosong,
          tagihanBelumLunas: txBulanIni.filter(t => t.status !== "lunas").length,
          pemasukanBulanIni: pemasukan,
          pengeluaranBulanIni: pengeluaran,
          pemasukanBulanLalu: pemasukanLalu,
          pengeluaranBulanLalu: pengeluaran * 0.9,
          totalTxBulanIni: txBulanIni.length,
          lunasBulanIni: txBulanIni.filter(t => t.status === "lunas").length,
        } as DashboardStats,
        unpaidTenants: unpaid,
      };
    }

    if (!roomData || !tenantData || !txData || !expData) return { stats: null, unpaidTenants: [] as UnpaidTenant[] };

    const allRooms = roomData.rooms;
    const tenants = tenantData;
    const txThisMonth = txData.filter((t: any) => t.periode_bulan === bulanIni && t.periode_tahun === tahunIni);
    const txLastMonth = txData.filter((t: any) => t.periode_bulan === bulanLalu && t.periode_tahun === tahunLalu);
    const expenses = expData;

    const pemasukan = txThisMonth.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0);
    const pengeluaran = expenses.reduce((s: number, e: any) => s + (e.jumlah || 0), 0);

    const unpaid: UnpaidTenant[] = txThisMonth
      .filter((tx: any) => tx.status !== "lunas")
      .map((tx: any) => {
        const tenant = tenants.find((t: any) => t.id === tx.tenant_id);
        const room = tenant?.room_id ? allRooms.find((r: any) => r.id === tenant.room_id) : null;
        return {
          nama: tenant?.nama || "-",
          no_hp: tenant?.no_hp || null,
          kamar: room?.nomor || "-",
          sisa: tx.total_tagihan - tx.jumlah_dibayar,
          periodLabel: `${getMonthName(tx.periode_bulan)} ${tx.periode_tahun}`,
        };
      });

    return {
      stats: {
        totalPenyewa: tenants.filter((t: any) => t.status === "aktif").length,
        kamarTerisi: allRooms.filter((r: any) => r.status === "terisi").length,
        kamarKosong: allRooms.filter((r: any) => r.status === "kosong").length,
        tagihanBelumLunas: txThisMonth.filter((t: any) => t.status !== "lunas").length,
        pemasukanBulanIni: pemasukan,
        pengeluaranBulanIni: pengeluaran,
        pemasukanBulanLalu: txLastMonth.reduce((s: number, t: any) => s + (t.jumlah_dibayar || 0), 0),
        pengeluaranBulanLalu: (expLastData || []).reduce((s: number, e: any) => s + (e.jumlah || 0), 0),
        totalTxBulanIni: txThisMonth.length,
        lunasBulanIni: txThisMonth.filter((t: any) => t.status === "lunas").length,
      } as DashboardStats,
      unpaidTenants: unpaid,
    };
  }, [demo.isDemo, roomData, tenantData, txData, expData]);

  const quickActions = [
    { icon: UserPlus, label: "Tambah Penyewa", action: () => navigate("/penyewa"), color: "bg-primary/10 text-primary" },
    { icon: CreditCard, label: "Pembayaran", action: () => navigate("/pembayaran"), color: "bg-[hsl(142,71%,45%)]/10 text-[hsl(142,71%,45%)]" },
    { icon: Send, label: "Kirim Tagihan", action: () => setShowTagihan(true), color: "bg-accent/10 text-accent" },
    { icon: Receipt, label: "Pengeluaran", action: () => navigate("/keuangan"), color: "bg-destructive/10 text-destructive" },
    { icon: LayoutGrid, label: "Daftar Kamar", action: () => navigate("/kamar"), color: "bg-[hsl(262,52%,47%)]/10 text-[hsl(262,52%,47%)]" },
    { icon: FileText, label: "Laporan", action: () => navigate("/keuangan"), color: "bg-[hsl(199,89%,48%)]/10 text-[hsl(199,89%,48%)]" },
  ];

  const laba = stats ? stats.pemasukanBulanIni - stats.pengeluaranBulanIni : 0;
  const labaBulanLalu = stats ? stats.pemasukanBulanLalu - (stats.pengeluaranBulanLalu || 0) : 0;
  const labaDiff = laba - labaBulanLalu;

  const propertyName = demo.isDemo ? demo.property.nama_kos : activeProperty?.nama_kos || "Dashboard";

  const lunasPct = stats && stats.totalTxBulanIni > 0 ? Math.round((stats.lunasBulanIni / stats.totalTxBulanIni) * 100) : 0;
  const donutData = stats ? [
    { name: "Lunas", value: stats.lunasBulanIni },
    { name: "Belum", value: stats.totalTxBulanIni - stats.lunasBulanIni },
  ] : [];
  const DONUT_COLORS = ["hsl(142, 71%, 45%)", "hsl(220, 13%, 91%)"];

  return (
    <AppShell>
      <PageHeader
        title={propertyName}
        subtitle={`${getMonthName(bulanIni)} ${tahunIni}`}
        action={<NotificationBell />}
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
              transition={{ duration: 0.15 }}
              className="gradient-primary rounded-xl p-5 text-primary-foreground shadow-lg"
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
                { icon: DoorOpen, label: "Kamar Terisi", value: stats.kamarTerisi, color: "text-[hsl(142,71%,45%)]" },
                { icon: DoorClosed, label: "Kamar Kosong", value: stats.kamarKosong, color: "text-muted-foreground" },
                { icon: AlertTriangle, label: "Belum Lunas", value: stats.tagihanBelumLunas, color: "text-[hsl(38,92%,50%)]" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                  className="bg-card rounded-xl p-4 border border-border shadow-sm"
                >
                  <stat.icon size={20} className={stat.color} />
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Donut Chart */}
            {stats.totalTxBulanIni > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.15 }}
                className="bg-card rounded-xl border border-border p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-foreground mb-3">Pembayaran Bulan Ini</p>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={42}
                          paddingAngle={3}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          strokeWidth={0}
                        >
                          {donutData.map((_, idx) => (
                            <Cell key={idx} fill={DONUT_COLORS[idx]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-foreground">{lunasPct}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: DONUT_COLORS[0] }} />
                      <span className="text-xs text-muted-foreground">Lunas ({stats.lunasBulanIni})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: DONUT_COLORS[1] }} />
                      <span className="text-xs text-muted-foreground">Belum ({stats.totalTxBulanIni - stats.lunasBulanIni})</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Aksi Cepat</h2>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:bg-muted transition-colors shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                      <action.icon size={18} />
                    </div>
                    <span className="text-[11px] font-medium text-foreground text-center leading-tight">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Kirim Tagihan Bottom Sheet */}
      <BottomSheet open={showTagihan} onClose={() => setShowTagihan(false)} title="Kirim Tagihan">
        <div className="space-y-3">
          {unpaidTenants.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Semua tagihan sudah lunas! 🎉</p>
            </div>
          ) : (
            unpaidTenants.map((t, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.nama}</p>
                  <p className="text-xs text-muted-foreground">Kamar {t.kamar} · {t.periodLabel}</p>
                  <p className="text-xs font-medium text-destructive mt-0.5">Sisa: {formatRupiah(t.sisa)}</p>
                </div>
                {t.no_hp ? (
                  <a
                    href={waTagihanLink(t.nama, t.kamar, t.periodLabel.split(" ")[0], t.periodLabel, t.sisa, t.no_hp)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-1">
                      <MessageCircle size={14} /> WA
                    </Button>
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No HP kosong</span>
                )}
              </div>
            ))
          )}
        </div>
      </BottomSheet>
    </AppShell>
  );
}
