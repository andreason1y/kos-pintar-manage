import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

type TripayStatus = "UNPAID" | "PAID" | "FAILED" | "EXPIRED" | "REFUND";

const MAX_POLLS = 60;
const POLL_INTERVAL_MS = 3000;

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const merchantRef = searchParams.get("merchant_ref");

  const [status, setStatus] = useState<TripayStatus | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!merchantRef) return;

    const poll = async () => {
      const { data } = await supabase
        .from("tripay_orders")
        .select("status")
        .eq("merchant_ref", merchantRef)
        .maybeSingle();

      if (!data) return;

      const s = data.status as TripayStatus;
      setStatus(s);

      if (s !== "UNPAID") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    };

    poll();
    pollRef.current = setInterval(() => {
      setPollCount((c) => {
        if (c >= MAX_POLLS) {
          if (pollRef.current) clearInterval(pollRef.current);
          setTimedOut(true);
          return c;
        }
        poll();
        return c + 1;
      });
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [merchantRef]);

  if (!merchantRef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Link tidak valid.</p>
      </div>
    );
  }

  const isPaid = status === "PAID";
  const isFailed = status === "FAILED" || status === "EXPIRED" || status === "REFUND";
  const isPending = !status || status === "UNPAID";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-sm p-8 flex flex-col items-center gap-5 text-center">

        {isPaid && (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Pembayaran Berhasil!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Langganan Anda sudah aktif. Selamat menggunakan KosPintar.
              </p>
            </div>
            <Button className="w-full font-semibold" onClick={() => navigate("/beranda")}>
              Masuk ke Aplikasi
            </Button>
          </>
        )}

        {isFailed && (
          <>
            <XCircle className="w-16 h-16 text-destructive" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Pembayaran Gagal</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Status: {status}. Silakan coba lagi atau hubungi support.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Kembali ke Beranda
            </Button>
          </>
        )}

        {isPending && !timedOut && (
          <>
            <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Menunggu Pembayaran</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Selesaikan pembayaran Anda, status akan diperbarui otomatis.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Ref: <span className="font-mono">{merchantRef}</span>
            </p>
          </>
        )}

        {isPending && timedOut && (
          <>
            <Clock className="w-16 h-16 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Menunggu Konfirmasi</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Pembayaran belum terkonfirmasi. Jika sudah bayar, langganan akan aktif dalam beberapa menit.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate("/beranda")}>
              Masuk ke Aplikasi
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
