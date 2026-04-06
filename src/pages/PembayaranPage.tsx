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
}

export default function PembayaranPage() {
  const { activeProperty } = useProperty();
  const demo = useDemo();
  const invalidate = useInvalidate();
  const [showPay, setShowPay] = useState<Payment | null>(null);
  const [showNota, setShowNota] = useState<Payment | null>(null);
  const [showEdit, setShowEdit] = useState<Payment | null>(null);
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [payError, setPayError] = useState("");
  const [metode, setMetode] = useState("tunai");
  const [catatan, setCatatan] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "lunas">("pending");
  const [editJumlah, setEditJumlah] = useState("");
  const [editMetode, setEditMetode] = useState("tunai");
  const [editStatus, setEditStatus] = useState("belum_bayar");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const propertyName = demo.isDemo ? demo.property.nama_kos : activeProperty?.nama_kos || "";

  const { data: tenantData, isLoading: tenantsLoading } = useTenants();
  const { data: txData, isLoading: txLoading } = useTransactions();
  const { data: roomData, isLoading: roomsLoading } = useRoomTypesAndRooms();

  const loading = !demo.isDemo && (tenantsLoading || txLoading || roomsLoading);

  const mapPayment = (tx: any, tenantNama: string, tenantHp: string | null, kamar: string): Payment => ({
    id: tx.id, tenant_nama: tenantNama, tenant_hp: tenantHp, kamar,
    periode_bulan: tx.periode_bulan, periode_tahun: tx.periode_tahun,
    total_tagihan: tx.total_tagihan, jumlah_dibayar: tx.jumlah_dibayar,
    status: tx.status, sisa: tx.total_tagihan - tx.jumlah_dibayar,
    metode_bayar: tx.metode_bayar, tanggal_bayar: tx.tanggal_bayar, nota_number: tx.nota_number,
  });

  const { pending, lunas } = useMemo(() => {
    if (demo.isDemo) {
      const all = demo.transactions.map(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        const room = tenant?.room_id ? demo.rooms.find(r => r.id === tenant.room_id) : null;
        return mapPayment(tx, tenant?.nama || "-", tenant?.no_hp || null, room?.nomor || "-");
      });
      return { pending: all.filter(p => p.status !== "lunas"), lunas: all.filter(p => p.status === "lunas") };
    }
    if (!txData || !tenantData || !roomData) return { pending: [] as Payment[], lunas: [] as Payment[] };
    const rooms = roomData.rooms;
    const all: Payment[] = txData.map((tx: any) => {
      const tenant = tenantData.find((t: any) => t.id === tx.tenant_id);
      const room = tenant?.room_id ? rooms.find((r: any) => r.id === tenant.room_id) : null;
      return mapPayment(tx, tenant?.nama || "-", tenant?.no_hp, room?.nomor || "-");
    });
    return { pending: all.filter(p => p.status !== "lunas"), lunas: all.filter(p => p.status === "lunas") };
  }, [demo.isDemo, txData, tenantData, roomData]);

  const refetch = () => { invalidate.transactions(); invalidate.tenants(); };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); setShowPay(null); return; }
    if (!showPay) return;
    const bayar = parseInt(jumlahBayar) || 0;
    if (bayar <= 0) { setPayError("Jumlah bayar harus lebih dari 0"); return; }
    const totalBayar = showPay.jumlah_dibayar + bayar;
    const newStatus = totalBayar >= showPay.total_tagihan ? "lunas" : "belum_lunas";
    const nota = newStatus === "lunas" ? generateNotaNumber(showPay.periode_bulan, showPay.periode_tahun) : null;
    const { error } = await supabase.from("transactions").update({ jumlah_dibayar: totalBayar, status: newStatus, metode_bayar: metode, tanggal_bayar: new Date().toISOString().split("T")[0], catatan, nota_number: nota } as any).eq("id", showPay.id);
    if (error) { toast.error(error.message); return; }
    toast.success(newStatus === "lunas" ? "Pembayaran lunas!" : "Pembayaran parsial berhasil");
    setShowPay(null); setJumlahBayar(""); setCatatan(""); setPayError("");
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
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); setShowEdit(null); return; }
    if (!showEdit) return;
    const { error } = await supabase.from("transactions").update({ jumlah_dibayar: parseInt(editJumlah) || 0, status: editStatus, metode_bayar: editMetode } as any).eq("id", showEdit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Transaksi diperbarui");
    setShowEdit(null);
    refetch();
  };

  const handleDeleteTx = async (id: string) => {
    if (demo.isDemo) { toast.info("Mode demo: fitur ini tidak tersedia"); return; }
    const { error } = await supabase.from("transactions").delete().eq("id", id) as any;
    if (error) { toast.error(error.message); return; }
    toast.success("Transaksi dihapus");
    refetch();
  };

  const currentList = activeTab === "pending" ? pending : lunas;

  return (
    <AppShell>
      <PageHeader title="Pembayaran" subtitle="Selesaikan tagihan penyewa" />
      <div className="px-4 space-y-3">
        <div className="flex gap-2">
          {([["pending", "Belum Lunas"], ["lunas", "Lunas"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >{label} ({key === "pending" ? pending.length : lunas.length})</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : currentList.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="text-muted-foreground" size={28} />}
            title={activeTab === "pending" ? "Semua tagihan lunas" : "Belum ada pembayaran lunas"}
            description={activeTab === "pending" ? "Tidak ada tagihan yang perlu diselesaikan" : "Pembayaran lunas akan muncul di sini"}
          />
        ) : (
          currentList.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, duration: 0.15 }}
              className="bg-card rounded-xl border border-border p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-foreground">{p.tenant_nama}</p>
                  <p className="text-sm text-muted-foreground">Kamar {p.kamar} · {getMonthName(p.periode_bulan)} {p.periode_tahun}</p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={p.status} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted">
                        <MoreVertical size={14} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setShowEdit(p); setEditJumlah(String(p.jumlah_dibayar)); setEditMetode(p.metode_bayar || "tunai"); setEditStatus(p.status);
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
                  <Button size="sm" className="flex-1" onClick={() => { setShowPay(p); setJumlahBayar(String(p.sisa)); setPayError(""); }}>
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
      <BottomSheet open={!!showPay} onClose={() => { setShowPay(null); setPayError(""); }} title="Selesaikan Pembayaran">
        {showPay && (
          <form onSubmit={handlePay} className="bottom-sheet-form">
            <div className="bottom-sheet-body">
              <div className="bg-muted rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{showPay.tenant_nama}</p>
                <p className="text-xs text-muted-foreground">Kamar {showPay.kamar} · {getMonthName(showPay.periode_bulan)} {showPay.periode_tahun}</p>
                <p className="text-sm">Tagihan: {formatRupiah(showPay.total_tagihan)} | Sudah bayar: {formatRupiah(showPay.jumlah_dibayar)}</p>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Bayar (Rp)</Label>
                <Input type="number" value={jumlahBayar} onChange={e => { setJumlahBayar(e.target.value); setPayError(""); }} />
                {payError && <p className="text-xs text-destructive">{payError}</p>}
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
              <div className="space-y-2"><Label>Jumlah Dibayar (Rp)</Label><Input type="number" value={editJumlah} onChange={e => setEditJumlah(e.target.value)} /></div>
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
