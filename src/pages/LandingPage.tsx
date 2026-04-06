import { useRef, useEffect, useState } from "react";
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
  Check, X, Instagram, MessageCircle, ChevronRight, ArrowRight,
  Users, DoorOpen, TrendingUp, CreditCard, Star
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

/* ─── Mini Dashboard Preview ─── */
function DashboardPreview() {
  return (
    <div className="bg-background p-3 space-y-3 text-[10px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-[8px]">Selamat datang 👋</p>
          <p className="font-bold text-[11px] text-foreground">Kos Harmoni</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Bell className="w-3 h-3 text-primary" />
        </div>
      </div>
      <div className="gradient-primary rounded-xl p-3 text-primary-foreground">
        <p className="text-[8px] opacity-80">Laba Bulan Ini</p>
        <p className="text-lg font-extrabold">Rp 9.150.000</p>
        <p className="text-[8px] opacity-80">↑ 12% dari bulan lalu</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Penyewa", value: "8", icon: Users, color: "text-primary" },
          { label: "Kamar Terisi", value: "8/12", icon: DoorOpen, color: "text-accent" },
          { label: "Belum Bayar", value: "2", icon: CreditCard, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-2 text-center">
            <s.icon className={`w-3 h-3 mx-auto mb-1 ${s.color}`} />
            <p className="font-bold text-[11px]">{s.value}</p>
            <p className="text-muted-foreground text-[7px]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-destructive border-r-accent flex-shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[8px]">Lunas (5)</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /><span className="text-[8px]">Belum Lunas (1)</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /><span className="text-[8px]">Belum Bayar (2)</span></div>
        </div>
      </div>
    </div>
  );
}

function TenantListPreview() {
  const tenants = [
    { name: "Budi Santoso", room: "A1 · Standar", status: "lunas", color: "bg-emerald-500" },
    { name: "Siti Rahayu", room: "A2 · Standar", status: "belum_lunas", color: "bg-amber-500" },
    { name: "Dewi Lestari", room: "B1 · Deluxe", status: "lunas", color: "bg-emerald-500" },
    { name: "Rizky Pratama", room: "B2 · Deluxe", status: "belum_bayar", color: "bg-red-500" },
    { name: "Fajar Ramadhan", room: "C1 · Suite", status: "lunas", color: "bg-emerald-500" },
  ];
  return (
    <div className="bg-background p-3 space-y-2 text-[10px]">
      <p className="font-bold text-[12px] text-foreground">Penyewa</p>
      {tenants.map((t) => (
        <div key={t.name} className="flex items-center gap-2 bg-card border border-border rounded-lg p-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">
            {t.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[10px] truncate">{t.name}</p>
            <p className="text-muted-foreground text-[8px]">{t.room}</p>
          </div>
          <div className={`w-2 h-2 rounded-full ${t.color}`} />
        </div>
      ))}
    </div>
  );
}

function RoomListPreview() {
  const rooms = [
    { type: "Standar", price: "1.2jt", rooms: [{ no: "A1", tenant: "Budi S.", filled: true }, { no: "A2", tenant: "Siti R.", filled: true }, { no: "A3", tenant: null, filled: false }] },
    { type: "Deluxe", price: "1.8jt", rooms: [{ no: "B1", tenant: "Dewi L.", filled: true }, { no: "B2", tenant: "Rizky P.", filled: true }] },
    { type: "Suite", price: "2.5jt", rooms: [{ no: "C1", tenant: "Fajar R.", filled: true }, { no: "C2", tenant: null, filled: false }] },
  ];
  return (
    <div className="bg-background p-3 space-y-2 text-[10px]">
      <p className="font-bold text-[12px] text-foreground">Kamar</p>
      {rooms.map((rt) => (
        <div key={rt.type} className="bg-card border border-border rounded-lg p-2 space-y-1.5">
          <div className="flex justify-between">
            <p className="font-semibold text-[10px]">{rt.type}</p>
            <p className="text-muted-foreground text-[8px]">Rp {rt.price}/bln</p>
          </div>
          {rt.rooms.map((r) => (
            <div key={r.no} className="flex items-center gap-2 pl-1">
              <div className={`w-1.5 h-1.5 rounded-full ${r.filled ? "bg-primary" : "bg-muted-foreground/30"}`} />
              <span className="font-medium">{r.no}</span>
              <span className="text-muted-foreground text-[8px]">{r.tenant || "Kosong"}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FinancePreview() {
  return (
    <div className="bg-background p-3 space-y-2 text-[10px]">
      <p className="font-bold text-[12px] text-foreground">Keuangan</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-primary/10 rounded-lg p-2">
          <p className="text-[8px] text-muted-foreground">Pemasukan</p>
          <p className="font-bold text-primary text-[11px]">Rp 12.0jt</p>
        </div>
        <div className="bg-destructive/10 rounded-lg p-2">
          <p className="text-[8px] text-muted-foreground">Pengeluaran</p>
          <p className="font-bold text-destructive text-[11px]">Rp 2.85jt</p>
        </div>
      </div>
      {[
        { title: "Bayar Listrik", cat: "Listrik", amount: "-850rb" },
        { title: "Bayar Air PDAM", cat: "Air", amount: "-350rb" },
        { title: "Internet Bulanan", cat: "Internet", amount: "-500rb" },
        { title: "Gaji Kebersihan", cat: "Kebersihan", amount: "-600rb" },
      ].map((e) => (
        <div key={e.title} className="flex items-center justify-between bg-card border border-border rounded-lg p-2">
          <div>
            <p className="font-semibold text-[10px]">{e.title}</p>
            <p className="text-muted-foreground text-[8px]">{e.cat}</p>
          </div>
          <p className="text-destructive font-semibold text-[10px]">{e.amount}</p>
        </div>
      ))}
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
const COMPARISON = [
  { feature: "Harga", kp: "Rp 249k/tahun (flat)", sk: "Rp 9.000/kamar/bulan" },
  { feature: "10 kamar setahun", kp: "Rp 249.000", sk: "Rp 1.080.000" },
  { feature: "20 kamar setahun", kp: "Rp 249.000", sk: "Rp 2.160.000" },
  { feature: "Manajemen penyewa", kp: true, sk: true },
  { feature: "Nota PDF", kp: true, sk: true },
  { feature: "Reminder WA otomatis", kp: true, sk: true },
  { feature: "Harga flat (bukan per kamar)", kp: true, sk: false },
  { feature: "Tanpa biaya tersembunyi", kp: true, sk: false },
];

const COMPETITOR_LABEL = "Aplikasi Lain";

/* ─── FAQ ─── */
const FAQS = [
  { q: "Apakah data saya aman?", a: "Ya, data disimpan di server terenkripsi dan hanya bisa diakses oleh Anda." },
  { q: "Berapa batas jumlah kamar?", a: "Paket standar mendukung hingga 40 unit kamar. Untuk lebih dari 40 unit, tersedia paket yang lebih besar." },
  { q: "Apakah ada biaya tambahan?", a: "Tidak ada. Harga Rp 249.000 sudah termasuk semua fitur untuk kelola kos-kosan Anda." },
  { q: "Bagaimana cara perpanjang langganan?", a: "Kami akan kirim notifikasi sebelum masa langganan habis. Perpanjang langsung dari aplikasi." },
  { q: "Apakah bisa dicoba dulu?", a: "Ya, tersedia mode demo tanpa perlu daftar. Klik \"Coba Demo\" di halaman utama." },
];

const TESTIMONIALS = [
  { quote: "Sebelumnya saya catat tagihan penyewa di buku tulis, sering lupa dan kecolongan. Sekarang semua otomatis, reminder WA langsung ke penyewa.", name: "Pak Hendra", kos: "Kos Putra Mandiri, Bandung", color: "bg-primary" },
  { quote: "Dibanding aplikasi lain yang saya coba, KosPintar jauh lebih simpel dan yang paling penting harganya flat. Punya 18 kamar tapi bayarnya sama aja.", name: "Bu Ratna", kos: "Kos Melati, Yogyakarta", color: "bg-accent" },
  { quote: "Nota PDF langsung kirim ke WhatsApp penyewa, profesional banget. Penyewa jadi lebih tepat waktu bayarnya.", name: "Pak Doni", kos: "Kos Barokah, Surabaya", color: "bg-destructive" },
];

const SCREENSHOTS = [
  { label: "Beranda — Dashboard Kos", component: <DashboardPreview /> },
  { label: "Penyewa — Data Penghuni", component: <TenantListPreview /> },
  { label: "Kamar — Status Real-time", component: <RoomListPreview /> },
  { label: "Keuangan — Laporan Bulanan", component: <FinancePreview /> },
];

const SLOT_TOTAL = 100;

export default function LandingPage() {
  const navigate = useNavigate();
  const { setIsDemo } = useDemo();
  const [slotsUsed, setSlotsUsed] = useState(0);
  const [slotsTaken, setSlotsTaken] = useState(0);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch real user count + settings for slot counter
  useEffect(() => {
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

  const handleRegister = () => navigate("/login?tab=register");
  const handleLogin = () => navigate("/login");

  const slotsRemaining = SLOT_TOTAL - (slotsTaken + slotsUsed);
  const earlyBirdActive = slotsRemaining > 0;

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
        <div className="mx-auto max-w-app flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center" aria-hidden="true">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-base text-foreground">KosPintar</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogin}>Masuk</Button>
            <Button size="sm" onClick={handleRegister}>Daftar</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-app">
        {/* ─── HERO ─── */}
        <section className="px-4 pt-10 pb-8" aria-label="Hero">
          <FadeIn>
            <h1 className="text-2xl font-extrabold leading-tight text-foreground">
              Aplikasi Manajemen Kos<br />
              <span className="text-primary">Terbaik di Indonesia</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="mt-2 text-base font-bold text-foreground/90 leading-snug">
              Kelola Penyewa, Tagihan & Keuangan Kos dalam Satu Aplikasi
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Tagihan otomatis, reminder WA, nota PDF, dan laporan keuangan lengkap. <strong>Hemat hingga Rp 1.800.000/tahun</strong> dibanding aplikasi kos lain.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-6 flex gap-3">
              <Button size="lg" className="flex-1 font-bold" onClick={handleRegister}>
                Daftar Sekarang
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="lg" variant="outline" className="flex-1 font-bold" onClick={handleDemo}>
                Coba Demo
              </Button>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-8">
              <PhoneMockup className="w-56">
                <DashboardPreview />
              </PhoneMockup>
            </div>
          </FadeIn>
        </section>

        {/* ─── FEATURES ─── */}
        <section className="px-4 py-10" aria-label="Fitur aplikasi manajemen kos">
          <FadeIn>
            <h2 className="text-lg font-extrabold text-foreground text-center">
              Fitur Lengkap untuk<br />Kelola Kos-kosan
            </h2>
          </FadeIn>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.08}>
                <Card className="h-full border-border/60">
                  <CardContent className="p-4 space-y-2">
                    <span className="text-xl" aria-hidden="true">{EMOJIS[i]}</span>
                    <h3 className="font-bold text-sm text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ─── APP SCREENSHOTS ─── */}
        <section className="py-10" aria-label="Screenshot tampilan aplikasi kos KosPintar">
          <FadeIn>
            <h2 className="text-lg font-extrabold text-foreground text-center px-4">
              Tampilan Aplikasi Manajemen Kos KosPintar
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              ref={scrollRef}
              className="mt-6 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {SCREENSHOTS.map((s) => (
                <div key={s.label} className="snap-center flex-shrink-0 w-48 space-y-2">
                  <PhoneMockup className="w-full">
                    {s.component}
                  </PhoneMockup>
                  <p className="text-center text-xs font-semibold text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="py-10" aria-label="Testimoni pengguna KosPintar">
          <FadeIn>
            <h2 className="text-lg font-extrabold text-foreground text-center px-4">
              Apa Kata Pengguna KosPintar?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              className="mt-6 flex gap-4 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-hide"
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
            <p className="text-[10px] text-muted-foreground text-center mt-2 italic">*Testimoni dari pengguna beta KosPintar</p>
          </FadeIn>
        </section>

        {/* ─── COMPARISON TABLE ─── */}
        <section className="px-4 py-10" aria-label="Perbandingan harga aplikasi kos">
          <FadeIn>
            <h2 className="text-lg font-extrabold text-foreground text-center">
              Kenapa KosPintar Lebih Hemat<br />dari Aplikasi Kos Lain?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="mt-6 rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs" aria-label="Tabel perbandingan KosPintar vs aplikasi kos lain">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-2.5 font-semibold text-muted-foreground">Fitur</th>
                    <th className="p-2.5 font-bold text-primary bg-primary/10 text-center">KosPintar</th>
                    <th className="p-2.5 font-semibold text-muted-foreground text-center">{COMPETITOR_LABEL}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <td className="p-2.5 text-foreground font-medium">{row.feature}</td>
                      <td className="p-2.5 text-center bg-primary/5 font-semibold text-primary">
                        {typeof row.kp === "boolean" ? (
                          row.kp ? <Check className="w-4 h-4 mx-auto text-primary" aria-label="Ya" /> : <X className="w-4 h-4 mx-auto text-muted-foreground" aria-label="Tidak" />
                        ) : row.kp}
                      </td>
                      <td className="p-2.5 text-center text-muted-foreground">
                        {typeof row.sk === "boolean" ? (
                          row.sk ? <Check className="w-4 h-4 mx-auto text-primary" aria-label="Ya" /> : <X className="w-4 h-4 mx-auto text-muted-foreground" aria-label="Tidak" />
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
        <section className="px-4 py-10" aria-label="Harga aplikasi manajemen kos">
          <FadeIn>
            <h2 className="text-lg font-extrabold text-foreground text-center">
              Harga Aplikasi Manajemen Kos<br />yang Terjangkau
            </h2>
          </FadeIn>

          {/* Starter */}
          <FadeIn delay={0.1}>
            <Card className="mt-6 border-primary/30 shadow-lg overflow-hidden">
              <div className="gradient-primary p-2.5 text-center">
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 font-bold text-xs">
                  🔥 Early Bird
                </Badge>
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">Starter</p>
                  <p className="text-sm text-muted-foreground line-through">Rp 499.000/tahun</p>
                  <p className="text-3xl font-extrabold text-foreground">
                    Rp 249.000<span className="text-base font-semibold text-muted-foreground">/tahun</span>
                  </p>
                  <p className="text-xs text-primary font-semibold mt-1">Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama</p>
                  <p className="text-xs text-muted-foreground mt-1">Kurang dari Rp 700/hari</p>
                </div>
                <div className="space-y-2">
                  {["Cocok untuk 1–40 kamar", "Unlimited penyewa", "Semua fitur", "Update gratis selamanya"].map((f) => (
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

          {/* Pro */}
          <FadeIn delay={0.2}>
            <Card className="mt-4 border-accent/30 shadow-lg overflow-hidden">
              <div className="bg-accent p-2.5 text-center">
                <Badge variant="secondary" className="bg-accent-foreground/20 text-accent-foreground border-0 font-bold text-xs">
                  Untuk kos besar
                </Badge>
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">Pro</p>
                  <p className="text-sm text-muted-foreground line-through">Rp 999.000/tahun</p>
                  <p className="text-3xl font-extrabold text-foreground">
                    Rp 499.000<span className="text-base font-semibold text-muted-foreground">/tahun</span>
                  </p>
                  <p className="text-xs text-accent font-semibold mt-1">Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama</p>
                </div>
                <div className="space-y-2">
                  {["Unlimited kamar", "Unlimited penyewa", "Semua fitur", "Update gratis selamanya", "Prioritas support"].map((f) => (
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

          {/* Slot counter */}
          <FadeIn delay={0.25}>
            <div className="mt-4 space-y-3">
              <p className="text-[11px] text-muted-foreground text-center">
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
        <section className="px-4 py-10" aria-label="FAQ tentang aplikasi KosPintar">
          <FadeIn>
            <h2 className="text-lg font-extrabold text-foreground text-center">
              Pertanyaan Seputar<br />Aplikasi KosPintar
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Accordion type="single" collapsible className="mt-6 space-y-2">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-semibold text-left">
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

        {/* ─── FINAL CTA ─── */}
        <section className="px-4 py-10" aria-label="Daftar sekarang">
          <FadeIn>
            <div className="gradient-primary rounded-2xl p-6 text-center space-y-4">
              <h2 className="text-lg font-extrabold text-primary-foreground">
                Mulai Kelola Kos Lebih Cerdas
              </h2>
              <p className="text-xs text-primary-foreground/80">
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
        <footer className="border-t border-border px-4 py-8 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center" aria-hidden="true">
              <Home className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-sm text-foreground">KosPintar</span>
          </div>
          <p className="text-xs text-muted-foreground">Aplikasi manajemen kos-kosan terbaik di Indonesia. Kelola penyewa, tagihan, dan keuangan kos dalam satu aplikasi.</p>

          <div className="flex flex-wrap gap-4 text-xs">
            {["Tentang", "Fitur", "Harga", "FAQ", "Kontak"].map((link) => (
              <button key={link} className="text-muted-foreground hover:text-foreground transition-colors">
                {link}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors" aria-label="Instagram KosPintar">
              <Instagram className="w-4 h-4 text-muted-foreground" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors" aria-label="WhatsApp KosPintar">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground">
            © 2026 KosPintar. All rights reserved.
          </p>
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
