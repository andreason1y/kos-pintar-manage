import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { createOrder, PAYMENT_METHODS, PaymentMethodCode } from "@/lib/tripay";
import { formatRupiah } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, CreditCard, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PLAN_LABELS: Record<string, string> = {
  mini: "Mini",
  starter: "Starter",
  pro: "Pro",
};

const PLAN_ROOMS: Record<string, string> = {
  mini: "hingga 10 kamar",
  starter: "hingga 25 kamar",
  pro: "hingga 60 kamar",
};

// Fallback prices (IDR) — same as FALLBACK_PRICES in LandingPage
const PRICES: Record<string, Record<number, number>> = {
  mini:    { 1: 25000,  3: 65000,  6: 109000, 12: 149000 },
  starter: { 1: 45000,  3: 119000, 6: 199000, 12: 249000 },
  pro:     { 1: 89000,  3: 229000, 6: 379000, 12: 499000 },
};

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan     = searchParams.get("plan") ?? "starter";
  const duration = parseInt(searchParams.get("duration") ?? "12", 10) as 1 | 3 | 6 | 12;
  const amount   = PRICES[plan]?.[duration] ?? 0;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodCode | null>(null);
  const [customerName, setCustomerName]     = useState("");
  const [customerPhone, setCustomerPhone]   = useState("");
  const [loading, setLoading]               = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Pre-fill name + phone from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nama, no_hp")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCustomerName(data.nama ?? "");
          setCustomerPhone(data.no_hp ?? "");
        }
        setProfileLoading(false);
      });
  }, [user]);

  const handleCheckout = async () => {
    if (!selectedMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Nama harus diisi");
      return;
    }
    if (!amount) {
      toast.error("Paket tidak valid");
      return;
    }

    setLoading(true);
    try {
      const result = await createOrder({
        plan,
        duration_months: duration,
        amount,
        payment_method: selectedMethod,
        customer_name: customerName.trim(),
        customer_email: user?.email ?? "",
        customer_phone: customerPhone.trim() || "08000000000",
      });

      // Redirect to Tripay-hosted payment page
      window.location.href = result.checkout_url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat transaksi";
      toast.error(msg);
      setLoading(false);
    }
  };

  if (!PLAN_LABELS[plan]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Paket tidak dikenali.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>

        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <p className="text-xs text-muted-foreground mb-1">Ringkasan Pesanan</p>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-foreground text-lg">
                KosPintar {PLAN_LABELS[plan]}
              </p>
              <p className="text-sm text-muted-foreground">
                {PLAN_ROOMS[plan]} · {duration === 12 ? "1 tahun" : `${duration} bulan`}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-foreground text-xl">{formatRupiah(amount)}</p>
              <p className="text-xs text-muted-foreground">
                ≈ {formatRupiah(Math.round(amount / duration))}/bln
              </p>
            </div>
          </div>
        </motion.div>

        {/* Customer info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-5 space-y-3"
        >
          <p className="text-xs text-muted-foreground font-medium">Data Pemesan</p>
          {profileLoading ? (
            <div className="space-y-2">
              <div className="h-10 bg-muted rounded-lg animate-pulse" />
              <div className="h-10 bg-muted rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Nama Lengkap</Label>
                <Input
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">No. HP (opsional)</Label>
                <Input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={user?.email ?? ""} disabled className="bg-muted" />
              </div>
            </>
          )}
        </motion.div>

        {/* Payment method */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <p className="text-xs text-muted-foreground font-medium mb-3">Metode Pembayaran</p>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.code}
                onClick={() => setSelectedMethod(m.code as PaymentMethodCode)}
                className={`relative flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  selectedMethod === m.code
                    ? "border-foreground bg-foreground/5 shadow-sm"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <CreditCard size={14} className={selectedMethod === m.code ? "text-foreground" : "text-muted-foreground"} />
                <span className={`text-xs font-medium leading-tight ${selectedMethod === m.code ? "text-foreground" : "text-muted-foreground"}`}>
                  {m.label}
                </span>
                {selectedMethod === m.code && (
                  <CheckCircle2 size={12} className="absolute top-2 right-2 text-foreground" />
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Button
            className="w-full font-semibold h-12 text-base"
            onClick={handleCheckout}
            disabled={loading || !selectedMethod || profileLoading}
          >
            {loading
              ? <><Loader2 size={16} className="mr-2 animate-spin" /> Memproses...</>
              : `Bayar ${formatRupiah(amount)}`
            }
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Pembayaran diproses melalui Tripay. Langganan aktif otomatis setelah pembayaran berhasil.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
