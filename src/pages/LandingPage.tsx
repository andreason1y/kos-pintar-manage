import { useRef, useEffect, useState } from "react";
import { initMetaPixel, trackEvent } from "@/lib/meta-pixel";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useDemo } from "@/lib/demo-context";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardList, Wallet, Home, FileText, BarChart3, Bell,
  Check, X, Instagram, MessageCircle, ArrowRight,
  Users, DoorOpen, TrendingUp, CreditCard, Star
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoIcon from "@/assets/logo-icon.png";

/* ─── Fade-in wrapper ─── */
function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Phone Mockup ─── */
function PhoneMockup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto ${className}`} role="img" aria-label="Tampilan aplikasi KosPintar di smartphone">
      <div className="rounded-[2rem] border-[6px] border-foreground/90 bg-background shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground/90 rounded-b-xl z-10" />
        <div className="pt-6 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── FEATURES ─── */
const FEATURES = [
  { icon: ClipboardList, title: "Manajemen Penyewa", desc: "Catat data, status bayar, dan riwayat sewa semua penyewa dalam satu tempat" },
  { icon: Wallet, title: "Tagihan Kos Otomatis", desc: "Tagihan dibuat otomatis tiap bulan, reminder WA dikirim otomatis ke penyewa" },
  { icon: Home, title: "Manajemen Kamar", desc: "Pantau status kamar kosong/terisi beserta nama penyewa secara real-time" },
  { icon: FileText, title: "Nota PDF", desc: "Generate dan kirim nota pembayaran langsung ke WhatsApp penyewa" },
  { icon: BarChart3, title: "Laporan Keuangan", desc: "Pantau pemasukan, pengeluaran, dan laba kos setiap bulan" },
  { icon: Bell, title: "Pengingat Otomatis", desc: "Notifikasi kontrak mau habis dan tagihan jatuh tempo" },
];

const EMOJIS = ["📋", "💰", "🏠", "📄", "📊", "🔔"];

/* ─── COMPARISON ─── */
const COMPARISON: { feature: string; kp: string | boolean; sk: string | boolean }[] = [
  { feature: "Harga (Mandiri)", kp: "Rp 249k/tahun (flat)", sk: "Rp 9.000/kamar/bulan" },
  { feature: "10 kamar setahun", kp: "Rp 249.000", sk: "Rp 1.080.000" },
  { feature: "20 kamar setahun", kp: "Rp 249.000", sk: "Rp 2.160.000" },
  { feature: "Manajemen penyewa", kp: true, sk: true },
  { feature: "Nota PDF", kp: true, sk: true },
  { feature: "Reminder WA ke penyewa", kp: true, sk: true },
  { feature: "Notifikasi jatuh tempo ke owner", kp: true, sk: false },
  { feature: "Laporan keuangan + export PDF", kp: true, sk: false },
  { feature: "Harga flat bukan per kamar", kp: true, sk: false },
  { feature: "Tanpa biaya tersembunyi", kp: true, sk: false },
  { feature: "Tidak terikat marketplace", kp: true, sk: false },
];

const COMPETITOR_LABEL = "Aplikasi Lain";

/* ─── FAQ ─── */
const FAQS = [
  { q: "Apakah data saya aman?", a: "Ya, data disimpan di server terenkripsi dan hanya bisa diakses oleh Anda." },
  { q: "Apa beda paket Mandiri dan Juragan?", a: "Paket Mandiri mendukung hingga 40 kamar. Paket Juragan mendukung hingga 200 kamar, plus prioritas support. Masing-masing 1 properti per akun." },
  { q: "Apakah ada biaya tambahan?", a: "Tidak ada. Harga sudah termasuk semua fitur untuk kelola kos-kosan Anda." },
  { q: "Bagaimana cara perpanjang langganan?", a: "Kami akan kirim notifikasi sebelum masa langganan habis. Perpanjang langsung dari aplikasi." },
  { q: "Apakah bisa dicoba dulu?", a: "Ya, tersedia mode demo tanpa perlu daftar. Klik \"Coba Demo\" di halaman utama." },
];

const TESTIMONIALS = [
  { quote: "Sewa sudah otomatis tercatat, saya tinggal cek HP kalau ada yang belum bayar. Jauh lebih rapi dari buku tulis.", name: "Pak Hendra S.", kos: "Kos di Bandung Utara", color: "bg-primary" },
  { quote: "Harganya flat, punya 18 kamar tapi bayarnya sama aja kayak yang punya 5 kamar. Masuk akal banget.", name: "Bu Ratna W.", kos: "Kos di Sleman, Yogyakarta", color: "bg-accent" },
  { quote: "Nota PDF langsung kirim ke WA penyewa, penyewa jadi lebih serius bayarnya.", name: "Pak Doni A.", kos: "Kos di Gubeng, Surabaya", color: "bg-destructive" },
];

const SCREENSHOTS = [
  { label: "Beranda — Dashboard Kos", src: "/screenshots/beranda.png" },
  { label: "Kamar — Tipe & Unit Kamar", src: "/screenshots/kamar.png" },
  { label: "Penyewa — Data Penghuni", src: "/screenshots/penyewa.png" },
  { label: "Keuangan — Laporan Bulanan", src: "/screenshots/keuangan.png" },
  { label: "Pembayaran — Tagihan Penyewa", src: "/screenshots/pembayaran.png" },
];

const SLOT_TOTAL = 100;

/* ─── Smooth scroll helper ─── */
function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { setIsDemo } = useDemo();
  const [slotsUsed, setSlotsUsed] = useState(0);
  const [slotsTaken, setSlotsTaken] = useState(0);
  const [slotsLoaded, setSlotsLoaded] = useState(false);

  useEffect(() => {
    initMetaPixel();
    trackEvent("ViewContent");

    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("settings").select("value").eq("key", "early_bird_slots_taken").single(),
    ]).then(([profileRes, settingsRes]) => {
      const userCount = profileRes.count || 0;
      const taken = settingsRes.data?.value || 0;
      setSlotsUsed(userCount);
      setSlotsTaken(taken);
      setSlotsLoaded(true);
    });
  }, []);

  const handleDemo = () => {
    setIsDemo(true);
    navigate("/beranda");
  };

  const handleRegister = () => {
    trackEvent("InitiateCheckout");
    navigate("/login?tab=register");
  };
  const handleLogin = () => navigate("/login");

  const slotsRemaining = SLOT_TOTAL - (slotsTaken + slotsUsed);
  const earlyBirdActive = slotsRemaining > 0;

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    smoothScrollTo(id);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ─── URGENCY BANNER ─── */}
      {slotsLoaded && earlyBirdActive && (
        <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-xs font-semibold">
          🔥 Early Bird: Tersisa {slotsRemaining} slot — Hemat 50% hari ini
        </div>
      )}

      {/* ─── STICKY HEADER ─── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between px-4 md:px-8 h-14 md:h-16">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="KosPintar" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-extrabold text-base md:text-lg text-foreground">KosPintar</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="sm" onClick={handleLogin}>Masuk</Button>
            <Button size="sm" onClick={handleRegister}>Daftar</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px]">
        {/* ─── HERO ─── */}
        <section className="px-4 md:px-8 pt-10 pb-8 md:pt-20 md:pb-16" aria-label="Hero">
          <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
            <div>
              <FadeIn>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-foreground">
                  Aplikasi Manajemen Kos<br />
                  <span className="text-primary">Terbaik di Indonesia</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h2 className="mt-2 md:mt-4 text-base md:text-xl font-bold text-foreground/90 leading-snug">
                  Kelola Penyewa, Tagihan & Keuangan Kos dalam Satu Aplikasi
                </h2>
              </FadeIn>
              <FadeIn delay={0.15}>
                <p className="mt-3 md:mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  Tagihan otomatis, reminder WA, nota PDF, dan laporan keuangan lengkap. <strong>Hemat hingga Rp 1.800.000/tahun</strong> dibanding aplikasi kos lain.
                </p>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="mt-6 flex gap-3 md:max-w-md">
                  <Button size="lg" className="flex-1 font-bold" onClick={handleRegister}>
                    Daftar Sekarang
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1 font-bold" onClick={handleDemo}>
                    Coba Demo
                  </Button>
                </div>
              </FadeIn>
            </div>
            <FadeIn delay={0.3} className="mt-8 md:mt-0">
              <PhoneMockup className="w-56 md:w-64 lg:w-72">
                <img src="/screenshots/beranda.png" alt="Dashboard KosPintar" className="w-full object-cover object-top" />
              </PhoneMockup>
            </FadeIn>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="fitur" className="px-4 md:px-8 py-10 md:py-16" aria-label="Fitur aplikasi manajemen kos">
          <FadeIn>
            <h2 className="text-lg md:text-2xl font-extrabold text-foreground text-center">
              Fitur Lengkap untuk Kelola Kos-kosan
            </h2>
          </FadeIn>
          <div className="mt-6 md:mt-10 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-4 md:p-5 space-y-2">
                    <span className="text-xl md:text-2xl" aria-hidden="true">{EMOJIS[i]}</span>
                    <h3 className="font-bold text-sm md:text-base text-foreground">{f.title}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ─── APP SCREENSHOTS ─── */}
        <section className="py-10 md:py-16" aria-label="Screenshot tampilan aplikasi kos KosPintar">
          <FadeIn>
            <h2 className="text-lg md:text-2xl font-extrabold text-foreground text-center px-4">
              Tampilan Aplikasi Manajemen Kos KosPintar
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            {/* Mobile: horizontal scroll */}
            <div
              className="mt-6 md:mt-10 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide md:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {SCREENSHOTS.map((s) => (
                <div key={s.label} className="snap-center flex-shrink-0 w-48 space-y-2">
                  <PhoneMockup className="w-full">
                    <img src={s.src} alt={s.label} className="w-full object-cover object-top" />
                  </PhoneMockup>
                  <p className="text-center text-xs font-semibold text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden md:grid md:grid-cols-5 gap-5 mt-10 px-8">
              {SCREENSHOTS.map((s) => (
                <div key={s.label} className="space-y-3">
                  <PhoneMockup className="w-full">
                    <img src={s.src} alt={s.label} className="w-full object-cover object-top" />
                  </PhoneMockup>
                  <p className="text-center text-sm font-semibold text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="py-10 md:py-16" aria-label="Testimoni pengguna KosPintar">
          <FadeIn>
            <h2 className="text-lg md:text-2xl font-extrabold text-foreground text-center px-4">
              Apa Kata Pengguna KosPintar?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            {/* Mobile: horizontal scroll */}
            <div
              className="mt-6 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide md:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {TESTIMONIALS.map((t) => (
                <Card key={t.name} className="snap-center flex-shrink-0 w-72 border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={`${t.color} text-primary-foreground text-[10px] font-bold`}>
                          {t.name.split(" ").map(w => w[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.kos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Desktop: 3-column grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-5 mt-10 px-8">
              {TESTIMONIALS.map((t) => (
                <Card key={t.name} className="border-border/60">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className={`${t.color} text-primary-foreground text-xs font-bold`}>
                          {t.name.split(" ").map(w => w[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.kos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-2 italic">*Testimoni dari pengguna beta KosPintar</p>
          </FadeIn>
        </section>

        {/* ─── COMPARISON TABLE ─── */}
        <section className="px-4 md:px-8 py-10 md:py-16" aria-label="Perbandingan harga aplikasi kos">
          <FadeIn>
            <h2 className="text-lg md:text-2xl font-extrabold text-foreground text-center">
              Kenapa KosPintar Lebih Hemat dari Aplikasi Kos Lain?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-6 md:mt-10 md:max-w-3xl md:mx-auto rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs md:text-sm" aria-label="Tabel perbandingan KosPintar vs aplikasi kos lain">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2.5 md:p-4 font-semibold text-muted-foreground">Fitur</th>
                    <th className="p-2.5 md:p-4 font-bold text-primary bg-primary/10 text-center">KosPintar</th>
                    <th className="p-2.5 md:p-4 font-semibold text-muted-foreground text-center">{COMPETITOR_LABEL}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <td className="p-2.5 md:p-4 text-foreground font-medium">{row.feature}</td>
                      <td className="p-2.5 md:p-4 text-center bg-primary/5 font-semibold text-primary">
                        {typeof row.kp === "boolean" ? (
                          row.kp ? <Check className="w-4 h-4 mx-auto text-primary" aria-label="Ya" /> : <X className="w-4 h-4 mx-auto text-muted-foreground/40" aria-label="Tidak" />
                        ) : row.kp}
                      </td>
                      <td className="p-2.5 md:p-4 text-center text-muted-foreground">
                        {typeof row.sk === "boolean" ? (
                          row.sk ? <Check className="w-4 h-4 mx-auto text-primary" aria-label="Ya" /> : <X className="w-4 h-4 mx-auto text-muted-foreground/40" aria-label="Tidak" />
                        ) : row.sk}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </section>

        {/* ─── PRICING ─── */}
        <section id="harga" className="px-4 md:px-8 py-10 md:py-16" aria-label="Harga aplikasi manajemen kos">
          <FadeIn>
            <h2 className="text-lg md:text-2xl font-extrabold text-foreground text-center">
              Harga Aplikasi Manajemen Kos yang Terjangkau
            </h2>
          </FadeIn>

          <div className="md:grid md:grid-cols-2 md:gap-6 md:max-w-3xl md:mx-auto md:mt-10">
            {/* Mandiri */}
            <FadeIn delay={0.1}>
              <Card className="mt-6 md:mt-0 border-primary/30 shadow-lg overflow-hidden">
                <div className="gradient-primary p-2.5 text-center">
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 font-bold text-xs">
                    🔥 Early Bird
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">Mandiri</p>
                    <p className="text-sm text-muted-foreground line-through">Rp 499.000/tahun</p>
                    <p className="text-3xl font-extrabold text-foreground">
                      Rp 249.000<span className="text-base font-semibold text-muted-foreground">/tahun</span>
                    </p>
                    <p className="text-xs text-primary font-semibold mt-1">Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama</p>
                    <p className="text-xs text-muted-foreground mt-1">Kurang dari Rp 700/hari</p>
                  </div>
                  <div className="space-y-2">
                    {["Maks 40 kamar", "Unlimited penyewa", "Semua fitur", "Update gratis selamanya"].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full font-bold" size="lg" onClick={handleRegister}>
                    Mulai Sekarang — Rp 249.000 →
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Juragan */}
            <FadeIn delay={0.2}>
              <Card className="mt-4 md:mt-0 border-accent/30 shadow-lg overflow-hidden">
                <div className="bg-accent p-2.5 text-center">
                  <Badge variant="secondary" className="bg-accent-foreground/20 text-accent-foreground border-0 font-bold text-xs">
                    Untuk kos besar
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">Juragan</p>
                    <p className="text-sm text-muted-foreground line-through">Rp 999.000/tahun</p>
                    <p className="text-3xl font-extrabold text-foreground">
                      Rp 499.000<span className="text-base font-semibold text-muted-foreground">/tahun</span>
                    </p>
                    <p className="text-xs text-accent font-semibold mt-1">Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama</p>
                  </div>
                  <div className="space-y-2">
                    {["Maks 200 kamar", "Unlimited penyewa", "Semua fitur", "Update gratis selamanya", "Prioritas support"].map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full font-bold bg-accent hover:bg-accent/90 text-accent-foreground" size="lg" onClick={handleRegister}>
                    Mulai Sekarang — Rp 499.000 →
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          {/* Slot counter */}
          <FadeIn delay={0.25}>
            <div className="mt-4 space-y-3 md:max-w-lg md:mx-auto">
              <p className="text-[11px] md:text-xs text-muted-foreground text-center">
                Harga naik setelah 100 pengguna pertama
              </p>
              {slotsLoaded && earlyBirdActive && (
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-xs font-semibold text-foreground">
                    Tersisa <span className="text-primary font-extrabold">{slotsRemaining}</span> dari {SLOT_TOTAL} slot Early Bird
                  </p>
                  <div className="mt-2 h-2 bg-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={SLOT_TOTAL - slotsRemaining} aria-valuemax={SLOT_TOTAL}>
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${((SLOT_TOTAL - slotsRemaining) / SLOT_TOTAL) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              {slotsLoaded && !earlyBirdActive && (
                <p className="text-xs text-muted-foreground text-center font-semibold">Early Bird telah berakhir</p>
              )}
            </div>
          </FadeIn>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="px-4 md:px-8 py-10 md:py-16" aria-label="FAQ tentang aplikasi KosPintar">
          <FadeIn>
            <h2 className="text-lg md:text-2xl font-extrabold text-foreground text-center">
              Pertanyaan Seputar Aplikasi KosPintar
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Accordion type="single" collapsible className="mt-6 md:mt-10 space-y-2 md:max-w-2xl md:mx-auto">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm md:text-base font-semibold text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </section>

        {/* ─── TENTANG KAMI ─── */}
        <section id="tentang" className="px-4 md:px-8 py-10 md:py-16" aria-label="Tentang KosPintar">
          <FadeIn>
            <div className="bg-muted rounded-2xl p-6 md:p-10 text-center md:max-w-3xl md:mx-auto">
              <h2 className="text-lg md:text-2xl font-extrabold text-foreground mb-3">Tentang Kami</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                KosPintar dibuat untuk membantu pemilik kos Indonesia kelola properti lebih mudah, tanpa ribet, tanpa mahal.
              </p>
            </div>
          </FadeIn>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="px-4 md:px-8 py-10 md:py-16" aria-label="Daftar sekarang">
          <FadeIn>
            <div className="gradient-primary rounded-2xl p-6 md:p-10 text-center space-y-4 md:max-w-3xl md:mx-auto">
              <h2 className="text-lg md:text-2xl font-extrabold text-primary-foreground">
                Mulai Kelola Kos Lebih Cerdas
              </h2>
              <p className="text-xs md:text-sm text-primary-foreground/80">
                Software kos-kosan terlengkap untuk pemilik properti Indonesia
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="font-bold"
                onClick={handleRegister}
              >
                Daftar Sekarang →
              </Button>
            </div>
          </FadeIn>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-border px-4 md:px-8 py-8 md:py-12">
          <div className="md:max-w-[1200px] md:mx-auto md:grid md:grid-cols-3 md:gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
            <img src={logoIcon} alt="KosPintar" className="h-10 w-10 rounded-lg object-contain" />
                <span className="font-extrabold text-base text-foreground">KosPintar</span>
              </div>
              <p className="text-xs text-muted-foreground">Aplikasi manajemen kos-kosan terbaik di Indonesia. Kelola penyewa, tagihan, dan keuangan kos dalam satu aplikasi.</p>
            </div>

            <div className="mt-6 md:mt-0">
              <div className="flex flex-wrap gap-4 text-xs md:flex-col md:gap-2">
                <a href="#tentang" onClick={e => handleAnchorClick(e, "tentang")} className="text-muted-foreground hover:text-foreground transition-colors">Tentang Kami</a>
                <a href="#fitur" onClick={e => handleAnchorClick(e, "fitur")} className="text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
                <a href="#harga" onClick={e => handleAnchorClick(e, "harga")} className="text-muted-foreground hover:text-foreground transition-colors">Harga</a>
                <a href="#faq" onClick={e => handleAnchorClick(e, "faq")} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
                <a href="https://wa.me/62818477620" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Kontak</a>
              </div>
            </div>

            <div className="mt-6 md:mt-0 space-y-4">
              <div className="flex gap-3">
                <a href="https://instagram.com/kospintar_id" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors" aria-label="Instagram KosPintar">
                  <Instagram className="w-4 h-4 text-muted-foreground" />
                </a>
                <a href="https://wa.me/62818477620" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors" aria-label="WhatsApp KosPintar">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
              <p className="text-[11px] text-muted-foreground">
                © 2026 KosPintar. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* ─── JSON-LD Structured Data ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "KosPintar",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: "Aplikasi manajemen kos-kosan terbaik di Indonesia. Kelola penyewa, tagihan otomatis, laporan keuangan, dan nota PDF.",
            offers: {
              "@type": "Offer",
              price: "249000",
              priceCurrency: "IDR",
              priceValidUntil: "2026-12-31",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "50",
            },
          }),
        }}
      />
    </div>
  );
}
