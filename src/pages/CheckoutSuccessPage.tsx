import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/plan-context";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, expiresAt } = usePlan();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("order_id");
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<any>(null);

  useEffect(() => {
    if (!user || !orderId) {
      setError("Order tidak ditemukan");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("order_id", orderId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (queryError) throw queryError;
        if (!data) throw new Error("Order tidak ditemukan");

        setTransaction(data);

        if (data.status === "success") {
          setVerified(true);
          setLoading(false);
        } else if (data.status === "pending") {
          // Poll until processed
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;
            const { data: updated } = await supabase
              .from("payment_transactions")
              .select("status")
              .eq("order_id", orderId)
              .maybeSingle();

            if (updated?.status === "success") {
              setVerified(true);
              clearInterval(pollInterval);
              setLoading(false);
            } else if (attempts >= 10) {
              clearInterval(pollInterval);
              setLoading(false);
            }
          }, 3000);

          return () => clearInterval(pollInterval);
        } else {
          throw new Error("Pembayaran gagal");
        }
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [user, orderId]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Silakan Login Dulu</h1>
          <Button onClick={() => navigate("/login")}>Kembali ke Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto mb-4 text-accent" size={48} />
              <h2 className="text-xl font-semibold mb-2">Memverifikasi Pembayaran...</h2>
              <p className="text-muted-foreground">Mohon tunggu sebentar</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
              <h2 className="text-2xl font-bold mb-2 text-red-600">Pembayaran Gagal</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="space-y-2">
                <p className="text-sm">Order ID: {orderId}</p>
                <p className="text-sm text-muted-foreground">Hubungi support jika ada pertanyaan</p>
              </div>
              <div className="mt-8 space-y-2">
                <Button onClick={() => navigate("/checkout")} className="w-full">
                  Coba Lagi
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                  Kembali ke Beranda
                </Button>
              </div>
            </div>
          ) : verified ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={64} />
              <h1 className="text-3xl font-bold mb-2">Pembayaran Berhasil!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Langganan Anda telah diaktifkan
              </p>

              {transaction && (
                <div className="bg-accent/10 rounded-lg p-6 mb-8">
                  <h2 className="font-semibold mb-4">Detail Pesanan</h2>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono text-sm">{transaction.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paket</span>
                      <span className="font-semibold capitalize">{transaction.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jumlah</span>
                      <span className="font-semibold">
                        Rp {transaction.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal Pembayaran</span>
                      <span className="font-semibold">
                        {new Date(transaction.created_at).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    {expiresAt && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">Berlaku Hingga</span>
                        <span className="font-semibold text-accent">
                          {new Date(expiresAt).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Button onClick={() => navigate("/beranda")} className="w-full">
                  Buka Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                  Kembali ke Beranda
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
