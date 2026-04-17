import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import * as Sentry from "@sentry/react";

const PLAN_CONFIG = {
  starter: { name: "Starter", price: 399000, rooms: 10 },
  pro: { name: "Pro", price: 699000, rooms: 25 },
  bisnis: { name: "Bisnis", price: 1299000, rooms: 60 },
};

interface SnapToken {
  snap_token: string;
  order_id: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const plan = (searchParams.get("plan") || "starter") as keyof typeof PLAN_CONFIG;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snap, setSnap] = useState<any>(null);

  const config = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;

  useEffect(() => {
    // Load Snap script
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "");
    script.onload = () => setSnap(window.snap);
    document.body.appendChild(script);

    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (!user) return;

    const generateToken = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-snap-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${user.id}`, // Will be replaced with real auth token by interceptor
            },
            body: JSON.stringify({ plan }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to generate payment token");
        }

        const data: SnapToken = await response.json();

        // Show Snap modal
        if (snap) {
          snap.pay(data.snap_token, {
            onSuccess: (result: any) => {
              navigate(`/checkout-success?order_id=${data.order_id}`);
            },
            onPending: (result: any) => {
              toast({
                title: "Pembayaran Tertunda",
                description: "Menunggu konfirmasi pembayaran...",
              });
            },
            onError: (result: any) => {
              Sentry.captureException(result, { tags: { source: "snap-payment" } });
              toast({
                title: "Pembayaran Gagal",
                description: "Terjadi kesalahan saat memproses pembayaran.",
                variant: "destructive",
              });
            },
            onClose: () => {
              if (!confirm("Anda yakin ingin meninggalkan halaman ini? Pembayaran akan dibatalkan.")) {
                return;
              }
              navigate("/");
            },
          });
        }
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        Sentry.captureException(err, { tags: { source: "checkout-snap-token" } });
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    generateToken();
  }, [user, plan, snap, navigate, toast]);

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
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-accent/5 p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-card rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground mb-8">Lengkapi pembayaran untuk mengaktifkan paket premium</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-semibold text-red-800">Terjadi Kesalahan</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-sm text-red-600 mt-2">
                  Hubungi support jika masalah berlanjut.
                </p>
              </div>
            </div>
          )}

          <div className="bg-accent/10 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paket</span>
                <span className="font-semibold">{config.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kapasitas Kamar</span>
                <span className="font-semibold">{config.rooms} Kamar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durasi</span>
                <span className="font-semibold">1 Bulan</span>
              </div>
              <div className="h-px bg-border my-3" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-accent">
                  Rp {config.price.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-accent" size={32} />
              <p className="text-muted-foreground">Mempersiapkan pembayaran...</p>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-4">Modal pembayaran akan muncul otomatis</p>
              <p>🔒 Pembayaran aman via Midtrans</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
