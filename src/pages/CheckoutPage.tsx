import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  mini: "Mini",
  starter: "Starter",
  pro: "Pro",
};

const PLAN_ROOMS: Record<string, string> = {
  mini: "Maks 10 kamar",
  starter: "Maks 25 kamar",
  pro: "Maks 60 kamar",
};

const DURATION_LABELS: Record<number, string> = {
  1: "1 Bulan",
  3: "3 Bulan",
  6: "6 Bulan",
  12: "1 Tahun",
};

const PAYMENT_METHODS = [
  { value: "QRIS", label: "QRIS (Semua Dompet & Bank)" },
  { value: "BRIVA", label: "BRI Virtual Account" },
  { value: "BNIVA", label: "BNI Virtual Account" },
  { value: "MANDIRIVA", label: "Mandiri Virtual Account" },
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan = searchParams.get("plan") ?? "";
  const duration = Number(searchParams.get("duration") ?? "1");

  const [price, setPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!plan || !duration) return;
    supabase
      .from("subscription_prices")
      .select("price")
      .eq("tier", plan)
      .eq("duration_months", duration)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setPrice(data.price);
        setLoadingPrice(false);
      });
  }, [plan, duration]);

  if (!plan || !PLAN_LABELS[plan] || !DURATION_LABELS[duration]) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Paket tidak valid.</p>
        <Button variant="outline" onClick={() => navigate("/")}>Kembali ke Beranda</Button>
      </div>
    );
  }

  if (!user) {
    navigate(`/login?plan=${plan}&duration=${duration}`);
    return null;
  }

  const handleBayar = async () => {
    if (!price) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tripay-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          plan,
          duration_months: duration,
          payment_method: paymentMethod,
          customer_name: session.user.user_metadata?.nama ?? "Pelanggan KosPintar",
          customer_phone: session.user.user_metadata?.no_hp,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkout_url) {
        throw new Error(data.error ?? "Gagal membuat transaksi");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2"
          onClick={() => navigate("/#harga")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Ganti Paket
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-1">
              <p className="font-semibold text-foreground">
                KosPintar {PLAN_LABELS[plan]}
              </p>
              <p className="text-sm text-muted-foreground">{PLAN_ROOMS[plan]}</p>
              <p className="text-sm text-muted-foreground">{DURATION_LABELS[duration]}</p>
            </div>

            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-medium">Total</span>
              {loadingPrice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-xl font-bold text-foreground">
                  {price !== null ? formatRupiah(price) : "—"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  paymentMethod === m.value
                    ? "border-foreground bg-muted/50"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={m.value}
                  checked={paymentMethod === m.value}
                  onChange={() => setPaymentMethod(m.value)}
                  className="accent-foreground"
                />
                <span className="text-sm font-medium">{m.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Button
          className="w-full font-semibold"
          size="lg"
          disabled={loading || loadingPrice || price === null}
          onClick={handleBayar}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</>
          ) : (
            <>Bayar {price !== null ? formatRupiah(price) : ""}</>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pembayaran aman diproses oleh Tripay</span>
        </div>
      </div>
    </div>
  );
}
