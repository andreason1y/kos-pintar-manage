import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProperty } from "@/lib/property-context";
import { formatRupiah, getMonthName, generateNotaNumber } from "@/lib/helpers";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import SkeletonCard from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, MessageCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface PendingPayment {
  id: string;
  tenant_id: string;
  tenant_nama: string;
  tenant_hp: string | null;
  kamar: string;
  periode_bulan: number;
  periode_tahun: number;
  total_tagihan: number;
  jumlah_dibayar: number;
  status: string;
  sisa: number;
}

export default function PembayaranPage() {
  const { activeProperty } = useProperty();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState<PendingPayment | null>(null);

  // Pay form
  const [jumlahBayar, setJumlahBayar] = useState("");
  const [metode, setMetode] = useState("tunai");
  const [catatan, setCatatan] = useState("");

  const fetchData = async () => {
    if (!activeProperty) return;
    setLoading(true);
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .eq("property_id", activeProperty.id)
      .neq("status", "lunas")
      .order("created_at", { ascending: false }) as any;

    if (!txData || txData.length === 0) { setPayments([]); setLoading(false); return; }

    const tenantIds = [...new Set((txData as any[]).map(t => t.tenant_id))];
    const { data: tenantData } = await supabase.from("tenants").select("id, nama, no_hp, room_id").in("id", tenantIds) as any;
    const tenants = tenantData || [];

    // Get rooms
    const roomIds = tenants.filter((t: any) => t.room_id).map((t: any) => t.room_id);
    let rooms: any[] = [];
    if (roomIds.length > 0) {
      const { data } = await supabase.from("rooms").select("id, nomor").in("id", roomIds) as any;
      rooms = data || [];
    }

    const mapped: PendingPayment[] = (txData as any[]).map(tx => {
      const tenant = tenants.find((t: any) => t.id === tx.tenant_id);
      const room = tenant?.room_id ? rooms.find((r: any) => r.id === tenant.room_id) : null;
      return {
        id: tx.id,
        tenant_id: tx.tenant_id,
        tenant_nama: tenant?.nama || "-",
        tenant_hp: tenant?.no_hp,
        kamar: room?.nomor || "-",
        periode_bulan: tx.periode_bulan,
        periode_tahun: tx.periode_tahun,
        total_tagihan: tx.total_tagihan,
        jumlah_dibayar: tx.jumlah_dibayar,
        status: tx.status,
        sisa: tx.total_tagihan - tx.jumlah_dibayar,
      };
    });

    setPayments(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeProperty]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPay) return;
    const bayar = parseInt(jumlahBayar) || 0;
    const totalBayar = showPay.jumlah_dibayar + bayar;
    const newStatus = totalBayar >= showPay.total_tagihan ? "lunas" : "belum_lunas";
    const nota = newStatus === "lunas" ? generateNotaNumber(showPay.periode_bulan, showPay.periode_tahun) : null;

    const { error } = await supabase.from("transactions").update({
      jumlah_dibayar: totalBayar,
      status: newStatus,
      metode_bayar: metode,
      tanggal_bayar: new Date().toISOString().split("T")[0],
      catatan,
      nota_number: nota,
    } as any).eq("id", showPay.id);

    if (error) { toast.error(error.message); return; }
    toast.success(newStatus === "lunas" ? "Pembayaran lunas!" : "Pembayaran parsial berhasil");
    setShowPay(null);
    setJumlahBayar(""); setCatatan("");
    fetchData();
  };

  return (
    <AppShell>
      <PageHeader title="Pembayaran" subtitle="Selesaikan tagihan penyewa" />
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
        ) : payments.length === 0 ? (
          <EmptyState icon={<CreditCard className="text-muted-foreground" size={28} />} title="Semua tagihan lunas" description="Tidak ada tagihan yang perlu diselesaikan" />
        ) : (
          payments.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-card rounded-xl border border-border p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-foreground">{p.tenant_nama}</p>
                  <p className="text-sm text-muted-foreground">Kamar {p.kamar} · {getMonthName(p.periode_bulan)} {p.periode_tahun}</p>
                </div>
                <Badge variant={p.status === "belum_bayar" ? "destructive" : "default"} className={p.status === "belum_lunas" ? "bg-warning text-warning-foreground" : ""}>
                  {p.status === "belum_bayar" ? "Belum Bayar" : "Belum Lunas"}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="text-muted-foreground">Sisa tagihan</span>
                <span className="font-bold text-foreground">{formatRupiah(p.sisa)}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => { setShowPay(p); setJumlahBayar(String(p.sisa)); }}>
                  <CreditCard size={14} className="mr-1" /> Bayar
                </Button>
                {p.tenant_hp && (
                  <a
                    href={waTagihanLink(p.tenant_nama, p.kamar, getMonthName(p.periode_bulan), `${getMonthName(p.periode_bulan)} ${p.periode_tahun}`, p.sisa, p.tenant_hp)}
                    target="_blank" rel="noreferrer"
                  >
                    <Button size="sm" variant="outline"><MessageCircle size={14} /></Button>
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <BottomSheet open={!!showPay} onClose={() => setShowPay(null)} title="Selesaikan Pembayaran">
        {showPay && (
          <form onSubmit={handlePay} className="space-y-4">
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-foreground">{showPay.tenant_nama}</p>
              <p className="text-xs text-muted-foreground">Kamar {showPay.kamar} · {getMonthName(showPay.periode_bulan)} {showPay.periode_tahun}</p>
              <p className="text-sm">Tagihan: {formatRupiah(showPay.total_tagihan)} | Sudah bayar: {formatRupiah(showPay.jumlah_dibayar)}</p>
            </div>
            <div className="space-y-2">
              <Label>Jumlah Bayar (Rp)</Label>
              <Input type="number" value={jumlahBayar} onChange={e => setJumlahBayar(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={metode} onValueChange={setMetode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tunai">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional" />
            </div>
            <Button type="submit" className="w-full">Simpan Pembayaran</Button>
          </form>
        )}
      </BottomSheet>
    </AppShell>
  );
}

function waTagihanLink(nama: string, kamar: string, bulan: string, tanggal: string, jumlah: number, hp?: string): string {
  const { waTagihanLink: fn } = require("@/lib/helpers");
  return fn(nama, kamar, bulan, tanggal, jumlah, hp);
}
