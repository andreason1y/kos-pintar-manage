import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getLocalOrder, TripayOrderRow } from "@/lib/tripay";
import { formatRupiah } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Clock, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_CONFIG: Record<string, {
  icon: typeof CheckCircle2;
  iconClass: string;
  title: string;
  subtitle: string;
}> = {
  PAID: {
    icon: CheckCircle2,
    iconClass: "text-[hsl(var(--success))]",
    title: "Pembayaran Berhasil!",
    subtitle: "Langganan Anda sudah aktif. Selamat menggunakan KosPintar.",
  },
  UNPAID: {
    icon: Clock,
    iconClass: "text-[hsl(var(--warning))]",
    title: "Menunggu Pembayaran",
    subtitle: "Selesaikan pembayaran sebelum batas waktu untuk mengaktifkan langganan.",
  },
  EXPIRED: {
    icon: XCircle,
    iconClass: "text-destructive",
    title: "Transaksi Kedaluwarsa",
    subtitle: "Batas waktu pembayaran telah lewat. Silakan buat transaksi baru.",
  },
  FAILED: {
    icon: XCircle,
    iconClass: "text-destructive",
    title: "Pembayaran Gagal",
    subtitle: "Terjadi masalah saat memproses pembayaran. Silakan coba lagi.",
  },
};

export default function CheckoutSuksesPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const merchantRef = searchParams.get("merchant_ref") ?? "";
  const [order, setOrder]   = useState<TripayOrderRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchantRef) { setLoading(false); return; }

    // Poll order status a few times — Tripay webhook may arrive with a short delay
    let attempts = 0;
    const poll = async () => {
      const data = await getLocalOrder(merchantRef);
      setOrder(data);
      attempts++;
      if (data?.status === "UNPAID" && attempts < 5) {
        setTimeout(poll, 3000);
      } else {
        setLoading(false);
      }
    };
    poll();
  }, [merchantRef]);

  if (loading && !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Memverifikasi pembayaran…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-sm text-muted-foreground text-center">
          Detail transaksi tidak ditemukan.
        </p>
        <Button onClick={() => navigate("/beranda")} variant="outline">
          Ke Dashboard
        </Button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["UNPAID"];
  const Icon = cfg.icon;
  const isPaid = order.status === "PAID";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 text-center space-y-5"
      >
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isPaid ? "bg-[hsl(var(--success))]/15" : "bg-muted"
          }`}>
            <Icon size={32} className={cfg.iconClass} />
          </div>
        </div>

        <div>
          <h1 className="text-lg font-bold text-foreground">{cfg.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cfg.subtitle}</p>
        </div>

        {/* Order detail */}
        <div className="bg-muted rounded-xl p-4 text-left space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paket</span>
            <span className="font-medium text-foreground capitalize">{order.plan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Durasi</span>
            <span className="font-medium text-foreground">
              {order.duration_months === 12 ? "1 tahun" : `${order.duration_months} bulan`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-foreground">{formatRupiah(order.amount)}</span>
          </div>
          {order.merchant_ref && (
            <div className="flex justify-between text-xs pt-1 border-t border-border">
              <span className="text-muted-foreground">Ref</span>
              <span className="font-mono text-muted-foreground">{order.merchant_ref}</span>
            </div>
          )}
        </div>

        {/* Pending: show pay instructions link */}
        {order.status === "UNPAID" && order.checkout_url && (
          <Button
            className="w-full"
            onClick={() => { window.location.href = order.checkout_url!; }}
          >
            Lanjutkan Pembayaran
          </Button>
        )}

        <Button
          className="w-full"
          variant={isPaid ? "default" : "outline"}
          onClick={() => navigate(isPaid ? "/beranda" : "/")}
        >
          {isPaid ? "Ke Dashboard" : "Kembali ke Beranda"}
        </Button>
      </motion.div>
    </div>
  );
}
