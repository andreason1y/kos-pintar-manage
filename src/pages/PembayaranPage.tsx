import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { formatRupiah, getMonthName, generateNotaNumber, waTagihanLink } from "@/lib/helpers";
import type { DemoTransaction } from "@/lib/demo-context";
import { downloadNota, getNotaWhatsAppLink } from "@/lib/nota-generator";
import { useTenants, useTransactions, useRoomTypesAndRooms, useInvalidate } from "@/hooks/use-queries";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import BottomSheet from "@/components/BottomSheet";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import { CreditCard, MessageCircle, FileText, Download, Send, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  tenant_nama: string;
  tenant_hp: string | null;
  kamar: string;
  periode_bulan: number;
  periode_tahun: number;
  total_tagihan: number;
  jumlah_dibayar: number;
  status: string;
  sisa: number;
  metode_bayar: string | null;
  tanggal_bayar: string | null;
  nota_number: string | null;
  daysUntilDue: number;
  jatuh_tempo_hari: number;
}

type Category = "akan_jatuh_tempo" | "jatuh_tempo_hari_ini" | "belum_lunas" | "lunas";

const CATEGORIES: { key: Category; label: string; badgeClass: string }[] = [
  { key: "akan_jatuh_tempo", label: "Akan Jatuh Tempo", badgeClass: "bg-[hsl(38,92%,50%)] text-white" },
  { key: "jatuh_tempo_hari_ini", label: "Jatuh Tempo Hari Ini", badgeClass: "bg-destructive text-destructive-foreground" },
  { key: "belum_lunas", label: "Belum Lunas", badgeClass: "bg-[hsl(0,50%,35%)] text-white" },
  { key: "lunas", label: "Lunas", badgeClass: "bg-[hsl(142,71%,45%)] text-white" },
];

function getDueDateLabel(days: number): string {
  if (days === 0) return "Jatuh tempo hari ini";
  if (days > 0) return `${days} hari lagi`;
  return `Terlambat ${Math.abs(days)} hari`;
}

function getDueDateColor(days: number): string {
  if (days > 1) return "text-[hsl(38,92%,50%)]";
  if (days === 0) return "text-destructive";
  return "text-[hsl(0,50%,35%)]";
}

export default function PembayaranPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const invalidate = useInvalidate();
  const [showPay, setShowPay] = useState<Payment | null>(null);
  const [showNota, setShowNota] = useState<Payment | null>(null);
  const [showEdit, setShowEdit] = useState<Payment | null>(null);
  const [metode, setMetode] = useState("tunai");
  const [catatan, setCatatan] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<Category>>(new Set(["akan_jatuh_tempo", "jatuh_tempo_hari_ini"]));
  const [editMetode, setEditMetode] = useState("tunai");
  const [editStatus, setEditStatus] = useState("belum_bayar");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [sortBy, setSortBy] = useState<"nama_asc" | "tanggal_terbaru" | "tanggal_terlama">("nama_asc");

  const propertyName = demo.isDemo ? demo.property.nama_kos : activeProperty?.nama_kos || "";

  const { data: tenantData, isLoading: tenantsLoading } = useTenants();
  const { data: txData, isLoading: txLoading } = useTransactions();
  const { data: roomData, isLoading: roomsLoading } = useRoomTypesAndRooms();

  const loading = !demo.isDemo && (tenantsLoading || txLoading || roomsLoading);

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const mapPayment = (tx: any, tenantNama: string, tenantHp: string | null, kamar: string, jatuhTempoHari: number): Payment => {
    // Due date = jatuh_tempo_hari in the transaction's period
    const dueDate = new Date(tx.periode_tahun, tx.periode_bulan - 1, jatuhTempoHari);
    const diffMs = dueDate.getTime() - todayDate.getTime();
    const daysUntilDue = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      id: tx.id, tenant_nama: tenantNama, tenant_hp: tenantHp, kamar,
      periode_bulan: tx.periode_bulan, periode_tahun: tx.periode_tahun,
      total_tagihan: tx.total_tagihan, jumlah_dibayar: tx.jumlah_dibayar,
      status: tx.status, sisa: tx.total_tagihan - tx.jumlah_dibayar,
      metode_bayar: tx.metode_bayar, tanggal_bayar: tx.tanggal_bayar, nota_number: tx.nota_number,
      daysUntilDue,
      jatuh_tempo_hari: jatuhTempoHari,
    };
  };

  const categorized = useMemo(() => {
    let allPayments: Payment[] = [];

    if (demo.isDemo) {
      allPayments = demo.transactions.map(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
        // Use jatuh_tempo_hari; fall back to tanggal_masuk day for legacy demo data
        const jatuhTempoHari = (tenant as any)?.jatuh_tempo_hari || (tenant?.tanggal_masuk ? new Date(tenant.tanggal_masuk).getDate() : 1);
        return mapPayment(tx, tenant?.nama || "-", tenant?.no_hp || null, room?.nomor || "-", jatuhTempoHari);
      });
    } else if (txData && tenantData && roomData) {
      const rooms = roomData.rooms;
      allPayments = txData.map((tx: any) => {
        const tenant = tenantData.find((t: any) => t.id === tx.tenant_id);
        const room = tenant?.room_id ? rooms.find((r: any) => r.id === tenant.room_id) : null;
        // Use jatuh_tempo_hari; fall back to tanggal_masuk day for tenants without it
        const jatuhTempoHari = tenant?.jatuh_tempo_hari || (tenant?.tanggal_masuk ? new Date(tenant.tanggal_masuk).getDate() : 1);
        return mapPayment(tx, tenant?.nama || "-", tenant?.no_hp, room?.nomor || "-", jatuhTempoHari);
      });
    }

    const result: Record<Category, Payment[]> = {
      akan_jatuh_tempo: [],
      jatuh_tempo_hari_ini: [],
      belum_lunas: [],
      lunas: [],
    };

    for (const p of allPayments) {
      const isPaid = p.jumlah_dibayar >= p.total_tagihan;
      if (isPaid) {
        result.lunas.push(p);
      } else if (p.daysUntilDue >= 1 && p.daysUntilDue <= 5) {
        result.akan_jatuh_tempo.push(p);
      } else if (p.daysUntilDue === 0) {
        result.jatuh_tempo_hari_ini.push(p);
      } else {
        // Overdue (daysUntilDue < 0) OR more than 5 days out (!isPaid)
        result.belum_lunas.push(p);
      }
    }

    return result;
  }, [demo.isDemo, txData, tenantData, roomData, demo.transactions, demo.tenants, demo.rooms]);

  const toggleCategory = (cat: Category) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const visiblePayments = useMemo(() => {
    const list: Payment[] = [];
    for (const cat of CATEGORIES) {
      if (activeCategories.has(cat.key)) {
        list.push(...categorized[cat.key]);
      }
    }

    // Apply sorting
    const sorted = [...list];
    if (sortBy === "nama_asc") {
      sorted.sort((a, b) => a.tenant_nama.localeCompare(b.tenant_nama));
    } else if (sortBy === "tanggal_terbaru") {
      sorted.sort((a, b) => {
        if (a.periode_tahun !== b.periode_tahun) return b.periode_tahun - a.periode_tahun;
        return b.periode_bulan - a.periode_bulan;
      });
    } else if (sortBy === "tanggal_terlama") {
      sorted.sort((a, b) => {
        if (a.periode_tahun !== b.periode_tahun) return a.periode_tahun - b.periode_tahun;
        return a.periode_bulan - b.periode_bulan;
      });
    }

    return sorted;
  }, [activeCategories, categorized, sortBy]);

  const refetch = () => { invalidate.all(); };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    if (!showPay) return;
    const totalBayar = showPay.total_tagihan;
    const newStatus = totalBayar >= showPay.total_tagihan ? "lunas" : "belum_lunas";
    const nota = newStatus === "lunas" ? generateNotaNumber(showPay.periode_bulan, showPay.periode_tahun) : null;

    if (demo.isDemo) {
      demo.updateTransaction(showPay.id, {
        jumlah_dibayar: totalBayar,
        status: newStatus as DemoTransaction["status"],
        metode_bayar: metode,
        tanggal_bayar: new Date().toISOString().split("T")[0],
        catatan,
        nota_number: nota,
      });
      toast.success("Pembayaran lunas!");
      setShowPay(null); setCatatan("");
      return;
    }
    const { error } = await supabase.from("transactions").update({ jumlah_dibayar: totalBayar, status: newStatus, metode_bayar: metode, tanggal_bayar: new Date().toISOString().split("T")[0], catatan, nota_number: nota } as any).eq("id", showPay.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pembayaran lunas!");
    setShowPay(null); setCatatan("");
    refetch();
  };

  const handleDownloadNota = (p: Payment) => {
    downloadNota({
      propertyName, notaNumber: p.nota_number || generateNotaNumber(p.periode_bulan, p.periode_tahun),
      tenantName: p.tenant_nama, roomNumber: p.kamar, periodeBulan: p.periode_bulan, periodeTahun: p.periode_tahun,
      totalTagihan: p.total_tagihan, jumlahDibayar: p.jumlah_dibayar, metodeBayar: p.metode_bayar || "tunai",
      tanggalBayar: p.tanggal_bayar || "-",
    });
    toast.success("Mengunduh nota PDF...");
  };

  const getWaNotaLink = (p: Payment) => getNotaWhatsAppLink(
    { propertyName, notaNumber: p.nota_number || generateNotaNumber(p.periode_bulan, p.periode_tahun),
      tenantName: p.tenant_nama, roomNumber: p.kamar, periodeBulan: p.periode_bulan, periodeTahun: p.periode_tahun,
      totalTagihan: p.total_tagihan, jumlahDibayar: p.jumlah_dibayar, metodeBayar: p.metode_bayar || "tunai",
      tanggalBayar: p.tanggal_bayar || "-" },
    p.tenant_hp || "",
  );

  const handleEditTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEdit) return;
    if (demo.isDemo) {
      demo.updateTransaction(showEdit.id, {
        status: editStatus as DemoTransaction["status"],
        metode_bayar: editMetode,
      });
      toast.success("Transaksi diperbarui");
      setShowEdit(null);
      return;
    }
    const { error } = await supabase.from("transactions").update({ status: editStatus, metode_bayar: editMetode } as any).eq("id", showEdit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Transaksi diperbarui");
    setShowEdit(null);
    refetch();
  };

  const handleDeleteTx = async (id: string) => {
    if (demo.isDemo) {
      demo.deleteTransaction(id);
      toast.success("Transaksi dihapus");
      return;
    }
    const { error } = await supabase.from("transactions").delete().eq("id", id) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Transaksi dihapus");
    refetch();
  };

  return (
    <AppShell>
      <PageHeader title="Pembayaran" subtitle="Selesaikan tagihan penyewa" />
      <div className="px-4 space-y-3">
        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const count = categorized[cat.key].length;
            const isActive = activeCategories.has(cat.key);
            return (
              <button
                key={cat.key}
                onClick={() => toggleCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <span>{cat.label}</span>
                <Badge className={`${cat.badgeClass} text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center border-0`}>
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Urutkan:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-auto bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="nama_asc">By Nama (A-Z)</SelectItem>
              <SelectItem value="tanggal_terbaru">By Tanggal (Terbaru)</SelectItem>
              <SelectItem value="tanggal_terlama">By Tanggal (Terlama)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : visiblePayments.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="text-muted-foreground" size={28} />}
            title="Tidak ada tagihan"
            description="Tidak ada tagihan dalam kategori yang dipilih"
          />
        ) : (
          visiblePayments.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.15 }}
              className="bg-card rounded-xl border border-border p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-foreground">{p.tenant_nama}</p>
                  <p className="text-sm text-muted-foreground">Kamar {p.kamar} · {getMonthName(p.periode_bulan)} {p.periode_tahun}</p>
                  {p.status !== "lunas" && (
                    <p className={`text-xs font-semibold mt-0.5 ${getDueDateColor(p.daysUntilDue)}`}>
                      {getDueDateLabel(p.daysUntilDue)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={p.jumlah_dibayar >= p.total_tagihan ? "lunas" : "belum_bayar"} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted">
                        <MoreVertical size={14} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setShowEdit(p); setEditMetode(p.metode_bayar || "tunai"); setEditStatus(p.status);
                      }}>
                        <Pencil size={14} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: p.id, name: `transaksi ${p.tenant_nama}` })}>
                        <Trash2 size={14} className="mr-2" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-muted-foreground">{p.status === "lunas" ? "Total" : "Sisa tagihan"}</span>
                <span className="font-bold text-foreground">{formatRupiah(p.status === "lunas" ? p.total_tagihan : p.sisa)}</span>
              </div>
              {p.status === "lunas" ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowNota(p)}>
                    <FileText size={14} className="mr-1" /> Lihat Nota
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => setShowPay(p)}>
                    <CreditCard size={14} className="mr-1" /> Bayar
                  </Button>
                  {p.tenant_hp && (
                    <a href={waTagihanLink(p.tenant_nama, p.kamar, getMonthName(p.periode_bulan), `${getMonthName(p.periode_bulan)} ${p.periode_tahun}`, p.sisa, p.tenant_hp)} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline"><MessageCircle size={14} /></Button>
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Pay bottom sheet */}
      <BottomSheet open={!!showPay} onClose={() => setShowPay(null)} title="Selesaikan Pembayaran">
        {showPay && (
          <form onSubmit={handlePay} className="bottom-sheet-form">
            <div className="bottom-sheet-body">
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{showPay.tenant_nama}</p>
                <p className="text-xs text-muted-foreground">Kamar {showPay.kamar} · {getMonthName(showPay.periode_bulan)} {showPay.periode_tahun}</p>
                <p className="text-sm">Tagihan: {formatRupiah(showPay.total_tagihan)} | Sudah bayar: {formatRupiah(showPay.jumlah_dibayar)}</p>
              </div>
              <div className="space-y-2"><Label>Metode Pembayaran</Label>
              <Select value={metode} onValueChange={setMetode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="tunai">Tunai</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="qris">QRIS</SelectItem>
              </SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Catatan</Label><Input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional" /></div>
            </div>
            <div className="bottom-sheet-footer">
              <Button type="submit" className="w-full h-12 text-base font-semibold">
                <CreditCard size={18} className="mr-2" /> Selesaikan Pembayaran
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Edit transaction */}
      <BottomSheet open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Transaksi">
        {showEdit && (
          <form onSubmit={handleEditTx} className="bottom-sheet-form">
            <div className="bottom-sheet-body">
              <div className="space-y-2"><Label>Metode</Label>
              <Select value={editMetode} onValueChange={setEditMetode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="tunai">Tunai</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="qris">QRIS</SelectItem>
              </SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="belum_bayar">Belum Bayar</SelectItem><SelectItem value="belum_lunas">Belum Lunas</SelectItem><SelectItem value="lunas">Lunas</SelectItem>
              </SelectContent></Select>
              </div>
            </div>
            <div className="bottom-sheet-footer">
              <Button type="submit" className="w-full">Simpan Perubahan</Button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Nota bottom sheet */}
      <BottomSheet open={!!showNota} onClose={() => setShowNota(null)} title="Nota Pembayaran">
        {showNota && (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-foreground">{propertyName}</p>
                  <p className="text-xs text-muted-foreground">{showNota.nota_number}</p>
                </div>
                <span className="text-xs text-primary font-semibold">KosPintar</span>
              </div>
              <div className="border-t border-border pt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Penyewa</span><span className="font-medium text-foreground">{showNota.tenant_nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kamar</span><span className="font-medium text-foreground">{showNota.kamar}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Periode</span><span className="font-medium text-foreground">{getMonthName(showNota.periode_bulan)} {showNota.periode_tahun}</span></div>
              </div>
              <div className="border-t border-border pt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-foreground">{formatRupiah(showNota.total_tagihan)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dibayar</span><span className="text-foreground">{formatRupiah(showNota.jumlah_dibayar)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span className="text-foreground capitalize">{showNota.metode_bayar}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tanggal</span><span className="text-foreground">{showNota.tanggal_bayar}</span></div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleDownloadNota(showNota)}>
                <Download size={14} className="mr-1" /> Download PDF
              </Button>
              {showNota.tenant_hp && (
                <a href={getWaNotaLink(showNota)} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full gap-1">
                    <Send size={14} /> Kirim WA
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) handleDeleteTx(deleteTarget.id); setDeleteTarget(null); }}
        itemName={deleteTarget?.name || ""}
      />
    </AppShell>
  );
}
