import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Check, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import logoIcon from "@/assets/logo-icon.png";

type Tier = "mini" | "starter" | "pro";

interface PriceMap {
  [tier: string]: { [duration: number]: number };
}

const TIER_ORDER: Tier[] = ["mini", "starter", "pro"];

const TIER_INFO: Record<Tier, { label: string; rooms: string; features: string[]; popular?: boolean }> = {
  mini: {
    label: "Mini",
    rooms: "Maks 10 kamar",
    features: ["Manajemen penyewa", "Tagihan otomatis", "Laporan keuangan", "Pengingat jatuh tempo"],
  },
  starter: {
    label: "Starter",
    rooms: "Maks 25 kamar",
    popular: true,
    features: ["Semua fitur Mini", "Multi kamar & tipe", "Export laporan", "Notifikasi WhatsApp"],
  },
  pro: {
    label: "Pro",
    rooms: "Maks 60 kamar",
    features: ["Semua fitur Starter", "Prioritas support", "Tidak terbatas tipe kamar", "Update fitur lebih awal"],
  },
};

const DURATION_OPTIONS = [
  { months: 1, label: "1 Bulan" },
  { months: 3, label: "3 Bulan", discount: "Hemat 13%" },
  { months: 6, label: "6 Bulan", discount: "Hemat 27%" },
  { months: 12, label: "1 Tahun", discount: "Hemat 50%" },
];

function formatRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function PilihPaketPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(1);

  useEffect(() => {
    supabase
      .from("subscription_prices")
      .select("tier, duration_months, price")
      .then(({ data }) => {
        if (!data) return;
        const map: PriceMap = {};
        for (const row of data) {
          if (!map[row.tier]) map[row.tier] = {};
          map[row.tier][row.duration_months] = row.price;
        }
        setPrices(map);
        setLoading(false);
      });
  }, []);

  const handlePilih = (tier: Tier) => {
    if (!user) {
      navigate(`/login?plan=${tier}&duration=${selectedDuration}`);
      return;
    }
    navigate(`/checkout?plan=${tier}&duration=${selectedDuration}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="KosPintar" className="w-8 h-8 object-contain" />
          <span className="font-bold text-foreground">KosPintar</span>
        </div>
        {user && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => signOut()}>
            <LogOut size={15} className="mr-1.5" /> Keluar
          </Button>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Pilih Paket Langganan</h1>
          <p className="text-muted-foreground mt-1 text-sm">Mulai kelola kos lebih rapi. Batalkan kapan saja.</p>
        </div>

        {/* Duration selector */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.months}
                onClick={() => setSelectedDuration(opt.months)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedDuration === opt.months
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
                {opt.discount && <span className="ml-1 text-[10px] text-emerald-600">{opt.discount}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIER_ORDER.map((tier, i) => {
              const info = TIER_INFO[tier];
              const price = prices[tier]?.[selectedDuration];
              const pricePerMonth = price ? Math.round(price / selectedDuration) : null;

              return (
                <motion.div
                  key={tier}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    info.popular
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card shadow-sm"
                  }`}
                >
                  {info.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                        TERPOPULER
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-foreground">{info.label}</h2>
                    <p className="text-xs text-muted-foreground">{info.rooms}</p>
                  </div>

                  <div className="mb-5">
                    {pricePerMonth !== null ? (
                      <>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-bold text-foreground">{formatRp(pricePerMonth)}</span>
                          <span className="text-xs text-muted-foreground mb-1">/bln</span>
                        </div>
                        {selectedDuration > 1 && price && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Total {formatRp(price)} untuk {selectedDuration} bulan
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {info.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={info.popular ? "default" : "outline"}
                    onClick={() => handlePilih(tier)}
                  >
                    Pilih {info.label}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pembayaran aman diproses oleh Tripay · Tidak ada biaya tersembunyi
        </p>
      </div>
    </div>
  );
}
