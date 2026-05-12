import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { initMetaPixel, trackEvent } from "@/lib/meta-pixel";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import { useDemo } from "@/lib/demo-context";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Instagram, MessageCircle, ArrowRight, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logoIcon from "@/assets/logo-icon.png";
import { FadeIn, PhoneMockup, Section, SectionHeading } from "./landing/LandingComponents";
import {
  FEATURES, HOW_IT_WORKS, PAIN_POINTS, COMPARISON, DEFAULT_FAQS, DEFAULT_TESTIMONIALS,
  SCREENSHOTS, TEXT_DEFAULTS, DEFAULTS
} from "./landing/LandingData";

function formatRupiahLanding(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function smoothScrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { properties, loading: propLoading } = useProperty();
  const { isDemo, setIsDemo } = useDemo();

  const [slotsUsed, setSlotsUsed] = useState(0);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [cfg, setCfg] = useState<Record<string, number>>({});
  const [cfgText, setCfgText] = useState<Record<string, string>>({});
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState(0);

  useEffect(() => {
    if (isDemo) navigate("/beranda", { replace: true });
  }, [isDemo, navigate]);

  useEffect(() => {
    initMetaPixel();
    trackEvent("ViewContent");
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("settings").select("key, value"),
      supabase.from("settings_text").select("key, value"),
    ]).then(([profileRes, settingsRes, textRes]) => {
      setSlotsUsed(profileRes.count || 0);
      const numMap: Record<string, number> = {};
      (settingsRes.data || []).forEach(r => { numMap[r.key] = r.value; });
      setCfg(numMap);
      if ((numMap.maintenance_mode ?? 0) === 1) setIsMaintenance(true);
      const txtMap: Record<string, string> = {};
      (textRes.data || []).forEach(r => { txtMap[r.key] = r.value; });
      setCfgText(txtMap);
      try { const p = JSON.parse(txtMap.faq_data || ""); if (Array.isArray(p) && p.length) setFaqs(p); } catch {}
      try { const p = JSON.parse(txtMap.testimonials_data || ""); if (Array.isArray(p) && p.length) setTestimonials(p); } catch {}
      setSlotsLoaded(true);
    });
  }, []);

  if (!authLoading && !propLoading && user && !isDemo) {
    return <Navigate to={properties.length > 0 ? "/beranda" : "/onboarding"} replace />;
  }

  if (authLoading || propLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <img src={logoIcon} alt="KosPintar" className="h-14 w-14 rounded-xl mb-6" />
        <h1 className="text-xl font-bold text-foreground mb-2">Sedang dalam Pemeliharaan</h1>
        <p className="text-sm text-muted-foreground">Kami sedang melakukan pemeliharaan. Silakan kembali lagi nanti.</p>
      </div>
    );
  }

  const handleRegister = () => { trackEvent("InitiateCheckout"); navigate("/login?tab=register"); };
  const handleLogin = () => navigate("/login");
  const t = (key: string) => cfgText[key] ?? TEXT_DEFAULTS[key] ?? "";

  const ebActive = (cfg.earlybird_active ?? DEFAULTS.earlybird_active) === 1;
  const slotTotal = cfg.earlybird_slots_total ?? DEFAULTS.earlybird_slots_total;
  const slotsTaken = cfg.early_bird_slots_taken ?? DEFAULTS.early_bird_slots_taken;
  const slotsRemaining = Math.max(0, slotTotal - (slotsTaken + slotsUsed));
  const earlyBirdActive = ebActive && slotsRemaining > 0;

  const proNormal = cfg.pro_price_normal ?? 199000;
  const proEB = cfg.pro_price_earlybird ?? 99000;
  const bisnisNormal = cfg.bisnis_price_normal ?? 399000;
  const bisnisEB = cfg.bisnis_price_earlybird ?? 199000;

  const bannerActive = (cfg.announcement_banner_active ?? DEFAULTS.announcement_banner_active) === 1;
  const bannerText = t("announcement_banner_text").replace("{slots}", String(slotsRemaining));
  const contactWa = t("contact_wa");

  const plans = [
    { name: "Pro", rooms: "Hingga 25 kamar", normal: proNormal, eb: proEB, features: ["Maks 25 kamar", "Semua fitur lengkap", "Update gratis selamanya"] },
    { name: "Bisnis", rooms: "Hingga 80 kamar", normal: bisnisNormal, eb: bisnisEB, popular: true, features: ["Maks 80 kamar", "Semua fitur lengkap", "Update gratis selamanya"] },
  ];

  const formatPerMonth = (yearly: number) => {
    const monthly = Math.round(yearly / 12 / 1000);
    return `Rp ${monthly}rb`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Banner — promo spesial */}
      {slotsLoaded && earlyBirdActive && bannerActive && (
        <div className="bg-foreground text-background text-center py-2.5 px-4 text-xs font-medium tracking-tight">
          Promo Spesial — Diskon 50%
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-5 md:px-8 h-14">
          <div className="flex items-center gap-2.5">
            <img src={logoIcon} alt="KosPintar" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-sm text-foreground tracking-tight">KosPintar</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#fitur" onClick={e => { e.preventDefault(); smoothScrollTo("fitur"); }} className="hover:text-foreground transition-colors">Fitur</a>
            <a href="#harga" onClick={e => { e.preventDefault(); smoothScrollTo("harga"); }} className="hover:text-foreground transition-colors">Harga</a>
            <a href="#faq" onClick={e => { e.preventDefault(); smoothScrollTo("faq"); }} className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-sm font-medium" onClick={handleLogin}>Masuk</Button>
            <Button size="sm" className="text-sm font-medium" onClick={handleRegister}>Daftar</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl">
        {/* Hero */}
        <Section className="pt-16 md:pt-28 pb-12 md:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-[1.1]">
                {t("hero_headline")}
              </h1>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mt-4 md:mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
                {t("hero_subheadline")}
              </p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="mt-3 text-sm text-muted-foreground/70">
                {t("hero_subtext")}
              </p>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="font-semibold text-sm px-8" onClick={handleRegister}>
                  Mulai Sekarang <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
                <Button size="lg" variant="outline" className="font-semibold text-sm px-8" onClick={() => setIsDemo(true)}>
                  Coba Demo Gratis
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60 text-center mt-3">
                Tidak perlu kartu kredit · Setup kurang dari 5 menit
              </p>
            </FadeIn>
            {slotsLoaded && (
              <FadeIn delay={0.3}>
                <div className="flex gap-8 justify-center flex-wrap mt-10 pt-8 border-t border-border/40">
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{slotsTaken + slotsUsed}+</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Pemilik kos aktif</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">&lt; 5 menit</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Waktu setup awal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">1 klik</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Kirim tagihan ke WA</p>
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </Section>

        {/* How It Works */}
        <Section>
          <SectionHeading
            tag="Cara Kerja"
            title="Mulai dalam 3 langkah mudah"
          />
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            {HOW_IT_WORKS.map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.08}>
                <div className="p-5 rounded-xl border border-border text-center space-y-3 hover:border-foreground/20 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center mx-auto">
                    {item.step}
                  </div>
                  <item.icon className="w-5 h-5 text-muted-foreground mx-auto" />
                  <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Section>

        {/* CTA setelah Cara Kerja */}
        <div className="text-center pb-2 px-5">
          <Button size="sm" variant="outline" className="font-medium text-sm" onClick={handleRegister}>
            Coba Sekarang — Gratis <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* Problem → Solution */}
        <Section id="masalah">
          <SectionHeading
            tag="Masalah"
            title="Masih pakai buku tulis untuk kelola kos?"
            subtitle="Cara lama bikin Anda kehilangan waktu, uang, dan kewarasan. Ada cara yang lebih baik."
          />
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {PAIN_POINTS.map((p, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors text-center space-y-1.5">
                  <p className="text-sm text-muted-foreground line-through">{p.before}</p>
                  <p className="text-sm font-semibold text-foreground">{p.after} ✓</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Section>

        {/* Features */}
        <Section id="fitur">
          <SectionHeading
            tag="Fitur"
            title="Semua yang Anda butuhkan. Tidak lebih, tidak kurang."
            subtitle="Dibangun dari kebutuhan nyata pemilik kos — bukan fitur-fitur yang tidak pernah dipakai."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.06}>
                <div className="p-5 rounded-xl border border-border hover:border-foreground/20 hover:shadow-sm transition-all group text-center">
                  <f.icon className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors mb-3 mx-auto" />
                  <h3 className="font-semibold text-sm text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Section>

        {/* Screenshots */}
        <Section>
          <SectionHeading
            tag="Tampilan"
            title="Bersih. Simpel. Langsung paham."
            subtitle="Tidak perlu training — buka aplikasi, langsung bisa pakai."
          />
          <FadeIn>
            <div className="flex flex-col items-center gap-6">
              <div className="w-52 md:w-64">
                <PhoneMockup>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeScreenshot}
                      src={SCREENSHOTS[activeScreenshot].src}
                      alt={SCREENSHOTS[activeScreenshot].label}
                      className="w-full object-cover object-top"
                      loading="lazy"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    />
                  </AnimatePresence>
                </PhoneMockup>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {SCREENSHOTS.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => setActiveScreenshot(i)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      i === activeScreenshot
                        ? "border-foreground text-foreground font-semibold bg-foreground/5"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>
        </Section>

        {/* Testimonials */}
        <Section>
          <SectionHeading
            tag="Testimoni"
            title="Dipercaya pemilik kos di seluruh Indonesia"
          />
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {testimonials.map((item, idx) => (
              <FadeIn key={idx} delay={idx * 0.08}>
                <Card className="border-border hover:border-foreground/15 transition-colors">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: item.stars || 5 }).map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                    <div className="flex items-center gap-2.5 pt-1">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-foreground text-background text-[10px] font-semibold">
                          {item.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.kos}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </Section>

        {/* CTA setelah Testimoni */}
        <FadeIn>
          <div className="text-center py-2 px-5">
            <p className="text-sm text-muted-foreground mb-3">
              Bergabung bersama pemilik kos lain yang sudah beralih ke cara digital.
            </p>
            <Button size="sm" className="font-medium text-sm" onClick={handleRegister}>
              Mulai Gratis Sekarang <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </FadeIn>

        {/* Comparison */}
        <Section>
          <SectionHeading
            tag="Perbandingan"
            title="Lebih hemat dari aplikasi kos lain"
            subtitle="Harga flat per tahun — bukan per kamar, bukan per bulan."
          />
          <FadeIn>
            <div className="max-w-3xl mx-auto rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 md:p-4 font-medium text-muted-foreground">Fitur</th>
                    <th className="p-3 md:p-4 font-semibold text-foreground text-center">KosPintar</th>
                    <th className="p-3 md:p-4 font-medium text-muted-foreground text-center">Lainnya</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="p-3 md:p-4 text-foreground">{row.feature}</td>
                      <td className="p-3 md:p-4 text-center font-semibold text-foreground">
                        {typeof row.kp === "boolean" ? (
                          row.kp ? <Check className="w-4 h-4 mx-auto text-accent" /> : <X className="w-4 h-4 mx-auto text-muted-foreground/30" />
                        ) : row.kp}
                      </td>
                      <td className="p-3 md:p-4 text-center text-muted-foreground">
                        {typeof row.sk === "boolean" ? (
                          row.sk ? <Check className="w-4 h-4 mx-auto text-foreground/50" /> : <X className="w-4 h-4 mx-auto text-muted-foreground/30" />
                        ) : row.sk}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </Section>

        {/* Pricing */}
        <Section id="harga">
          <SectionHeading
            tag="Harga"
            title="Satu harga, semua fitur"
            subtitle="Bayar sekali per tahun. Tidak ada biaya tersembunyi. Tidak ada biaya per kamar."
          />
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 max-w-2xl mx-auto">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.08} className="flex">
                <Card className={`flex flex-col w-full transition-all hover:shadow-md ${plan.popular ? "border-foreground shadow-sm" : "border-border"}`}>
                  <CardContent className="p-5 md:p-6 flex flex-col flex-1 text-center">
                    <div className="mb-4">
                      <div className="flex items-center justify-center gap-2">
                        <p className="font-semibold text-foreground">{plan.name}</p>
                        {plan.popular && <Badge className="bg-foreground text-background text-[10px] px-1.5 py-0">Populer</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.rooms}</p>
                    </div>
                    <div className="mb-5">
                      {earlyBirdActive ? (
                        <>
                          <p className="text-xs text-muted-foreground line-through">{formatPerMonth(plan.normal)}/bln</p>
                          <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                            {formatPerMonth(plan.eb)}
                            <span className="text-sm font-normal text-muted-foreground">/bln</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">Dibayar {formatRupiahLanding(plan.eb)}/tahun</p>
                          <p className="text-[10px] text-accent font-medium mt-0.5">Promo Spesial</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                            {formatPerMonth(plan.normal)}
                            <span className="text-sm font-normal text-muted-foreground">/bln</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">Dibayar {formatRupiahLanding(plan.normal)}/tahun</p>
                        </>
                      )}
                    </div>
                    <div className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center justify-center gap-2">
                          <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{f}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className={`w-full font-semibold ${plan.popular ? "" : "variant-outline"}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={handleRegister}
                    >
                      Pilih {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3}>
            <p className="mt-6 text-xs text-muted-foreground text-center">
              Dibayar per tahun. Semua paket termasuk semua fitur.
            </p>
          </FadeIn>
        </Section>

        {/* FAQ */}
        <Section id="faq">
          <SectionHeading
            tag="FAQ"
            title=""
          />
          <FadeIn>
            <Accordion type="single" collapsible className="max-w-2xl mx-auto space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 data-[state=open]:border-foreground/20">
                  <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </Section>

        {/* Final CTA */}
        <Section>
          <FadeIn>
            <div className="bg-foreground rounded-2xl p-8 md:p-14 text-center max-w-3xl mx-auto">
              <h2 className="text-xl md:text-3xl font-bold text-background tracking-tight">
                Siap kelola kos tanpa ribet?
              </h2>
              <p className="mt-3 text-sm text-background/60">
                Daftar sekarang — setup kurang dari 5 menit.
              </p>
              <Button size="lg" variant="secondary" className="mt-6 font-semibold px-8" onClick={handleRegister}>
                Mulai Sekarang <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </FadeIn>
        </Section>

        {/* Footer */}
        <footer className="border-t border-border px-5 md:px-8 py-10 md:py-14">
          <div className="max-w-5xl mx-auto md:grid md:grid-cols-3 md:gap-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src={logoIcon} alt="KosPintar" className="h-8 w-8 rounded-lg" />
                <span className="font-bold text-sm text-foreground">KosPintar</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t("footer_tagline")}</p>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs md:flex-col md:gap-2">
                <a href="#fitur" onClick={e => { e.preventDefault(); smoothScrollTo("fitur"); }} className="text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
                <a href="#harga" onClick={e => { e.preventDefault(); smoothScrollTo("harga"); }} className="text-muted-foreground hover:text-foreground transition-colors">Harga</a>
                <a href="#faq" onClick={e => { e.preventDefault(); smoothScrollTo("faq"); }} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
                <a href={`https://wa.me/${contactWa}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Kontak</a>
              </div>
            </div>
            <div className="mt-6 md:mt-0 space-y-3">
              <div className="flex gap-2">
                <a href="https://instagram.com/kospintar_id" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" aria-label="Instagram">
                  <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <a href={`https://wa.me/${contactWa}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors" aria-label="WhatsApp">
                  <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </div>
              <p className="text-[11px] text-muted-foreground">© 2026 KosPintar. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "SoftwareApplication", name: "KosPintar",
        applicationCategory: "BusinessApplication", operatingSystem: "Web",
        description: "Software manajemen kos-kosan untuk pemilik properti Indonesia.",
        offers: { "@type": "Offer", price: "199000", priceCurrency: "IDR", priceValidUntil: "2026-12-31" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "50" },
      }) }} />
    </div>
  );
}
