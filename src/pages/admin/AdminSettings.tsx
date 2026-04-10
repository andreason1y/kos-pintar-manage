import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface SettingRow { id: string; key: string; value: number; }
interface SettingTextRow { id: string; key: string; value: string; }

interface FaqItem { q: string; a: string; }
interface TestimonialItem { quote: string; name: string; kos: string; stars: number; }

function logActivity(action: string, detail?: string) {
  supabase.from("admin_activity_log").insert({ admin_email: "admin", action, detail } as any).then(() => {});
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [settingsText, setSettingsText] = useState<SettingTextRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Numeric settings
  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(true);
  const [earlyBirdSlotsTaken, setEarlyBirdSlotsTaken] = useState(0);
  const [earlyBirdTotalSlots, setEarlyBirdTotalSlots] = useState(100);
  // Starter plan
  const [priceStarterNormal, setPriceStarterNormal] = useState(399000);
  const [priceStarterEarly, setPriceStarterEarly] = useState(199000);
  // Pro plan
  const [priceProNormal, setPriceProNormal] = useState(699000);
  const [priceProEarly, setPriceProEarly] = useState(349000);
  // Bisnis plan
  const [priceBisnisNormal, setPriceBisnisNormal] = useState(1199000);
  const [priceBisnisEarly, setPriceBisnisEarly] = useState(599000);
  const [announcementBannerActive, setAnnouncementBannerActive] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [inAppAnnouncementActive, setInAppAnnouncementActive] = useState(false);

  // Text settings
  const [earlybirdLabel, setEarlybirdLabel] = useState("Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama");
  const [starterSublabel, setStarterSublabel] = useState("");
  const [proSublabel, setProSublabel] = useState("");
  const [bisnisSublabel, setBisnisSublabel] = useState("");
  const [starterBadge, setStarterBadge] = useState("🔥 Early Bird");
  const [proBadge, setProBadge] = useState("🔥 Early Bird");
  const [bisnisBadge, setBisnisBadge] = useState("🔥 Early Bird");
  const [announcementBannerText, setAnnouncementBannerText] = useState("🔥 Early Bird: Tersisa {slots} slot — Hemat 50% hari ini");
  const [pricingFooterText, setPricingFooterText] = useState("Harga naik setelah 100 pengguna pertama");
  const [heroHeadline, setHeroHeadline] = useState("Aplikasi Manajemen Kos Terbaik di Indonesia");
  const [heroSubheadline, setHeroSubheadline] = useState("Kelola Penyewa, Tagihan & Keuangan Kos dalam Satu Aplikasi");
  const [heroSubtext, setHeroSubtext] = useState("");
  const [footerTagline, setFooterTagline] = useState("");
  const [contactWa, setContactWa] = useState("62818477620");
  const [contactEmail, setContactEmail] = useState("hello@kospintar.id");
  const [adminEmail, setAdminEmail] = useState("andreassina9a@gmail.com");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [inAppAnnouncementText, setInAppAnnouncementText] = useState("");

  // Email notification settings
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [emailSenderAddress, setEmailSenderAddress] = useState("noreply@kospintar.id");
  const [emailNotificationSubject, setEmailNotificationSubject] = useState("Notifikasi Tagihan Jatuh Tempo - {property_name}");
  const [emailNotificationTemplate, setEmailNotificationTemplate] = useState("");

  // FAQ & Testimonials
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [numRes, textRes] = await Promise.all([
        supabase.from("settings").select("*") as any,
        supabase.from("settings_text").select("*") as any,
      ]);
      const rows = (numRes.data || []) as SettingRow[];
      const textRows = (textRes.data || []) as SettingTextRow[];
      setSettings(rows);
      setSettingsText(textRows);

      const map: Record<string, number> = {};
      rows.forEach(r => { map[r.key] = r.value; });
      setEarlyBirdEnabled((map.earlybird_active ?? 1) === 1);
      setEarlyBirdSlotsTaken(map.early_bird_slots_taken ?? 0);
      setEarlyBirdTotalSlots(map.earlybird_slots_total ?? 100);
      setPriceStarterNormal(map.starter_price_normal ?? 399000);
      setPriceStarterEarly(map.starter_price_earlybird ?? 199000);
      setPriceProNormal(map.pro_price_normal ?? 699000);
      setPriceProEarly(map.pro_price_earlybird ?? 349000);
      setPriceBisnisNormal(map.bisnis_price_normal ?? 1199000);
      setPriceBisnisEarly(map.bisnis_price_earlybird ?? 599000);
      setAnnouncementBannerActive((map.announcement_banner_active ?? 1) === 1);
      setMaintenanceMode((map.maintenance_mode ?? 0) === 1);
      setInAppAnnouncementActive((map.in_app_announcement_active ?? 0) === 1);

      const tmap: Record<string, string> = {};
      textRows.forEach(r => { tmap[r.key] = r.value; });
      setEarlybirdLabel(tmap.earlybird_label ?? "Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama");
      setStarterSublabel(tmap.starter_sublabel ?? "");
      setProSublabel(tmap.pro_sublabel ?? "");
      setBisnisSublabel(tmap.bisnis_sublabel ?? "");
      setStarterBadge(tmap.starter_earlybird_badge ?? "🔥 Early Bird");
      setProBadge(tmap.pro_earlybird_badge ?? "🔥 Early Bird");
      setBisnisBadge(tmap.bisnis_earlybird_badge ?? "🔥 Early Bird");
      setAnnouncementBannerText(tmap.announcement_banner_text ?? "🔥 Early Bird: Tersisa {slots} slot — Hemat 50% hari ini");
      setPricingFooterText(tmap.pricing_footer_text ?? "Harga naik setelah 100 pengguna pertama");
      setHeroHeadline(tmap.hero_headline ?? "Aplikasi Manajemen Kos Terbaik di Indonesia");
      setHeroSubheadline(tmap.hero_subheadline ?? "Kelola Penyewa, Tagihan & Keuangan Kos dalam Satu Aplikasi");
      setHeroSubtext(tmap.hero_subtext ?? "");
      setFooterTagline(tmap.footer_tagline ?? "");
      setContactWa(tmap.contact_wa ?? "62818477620");
      setContactEmail(tmap.contact_email ?? "hello@kospintar.id");
      setAdminEmail(tmap.admin_email ?? "andreassina9a@gmail.com");
      setAppVersion(tmap.app_version ?? "1.0.0");
      setInAppAnnouncementText(tmap.in_app_announcement_text ?? "");
      setEmailNotificationsEnabled((map.email_notifications_enabled ?? 0) === 1);
      setEmailSenderAddress(tmap.email_sender_address ?? "noreply@kospintar.id");
      setEmailNotificationSubject(tmap.email_notification_subject ?? "Notifikasi Tagihan Jatuh Tempo - {property_name}");
      setEmailNotificationTemplate(tmap.email_notification_template ?? "");

      try { setFaqs(JSON.parse(tmap.faq_data || "[]")); } catch { setFaqs([]); }
      try { setTestimonials(JSON.parse(tmap.testimonials_data || "[]")); } catch { setTestimonials([]); }

      setLoading(false);
    };
    load();
  }, []);

  const upsertNum = async (key: string, value: number) => {
    const existing = settings.find(s => s.key === key);
    if (existing) {
      await supabase.from("settings").update({ value } as any).eq("id", existing.id);
    } else {
      await supabase.from("settings").insert({ key, value } as any);
    }
  };

  const upsertText = async (key: string, value: string) => {
    const existing = settingsText.find(s => s.key === key);
    if (existing) {
      await supabase.from("settings_text").update({ value } as any).eq("id", existing.id);
    } else {
      await supabase.from("settings_text").insert({ key, value } as any);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const numUpdates: Record<string, number> = {
      earlybird_active: earlyBirdEnabled ? 1 : 0,
      early_bird_slots_taken: earlyBirdSlotsTaken,
      earlybird_slots_total: earlyBirdTotalSlots,
      starter_price_normal: priceStarterNormal,
      starter_price_earlybird: priceStarterEarly,
      pro_price_normal: priceProNormal,
      pro_price_earlybird: priceProEarly,
      bisnis_price_normal: priceBisnisNormal,
      bisnis_price_earlybird: priceBisnisEarly,
      announcement_banner_active: announcementBannerActive ? 1 : 0,
      maintenance_mode: maintenanceMode ? 1 : 0,
      in_app_announcement_active: inAppAnnouncementActive ? 1 : 0,
      email_notifications_enabled: emailNotificationsEnabled ? 1 : 0,
    };

    for (const [key, value] of Object.entries(numUpdates)) {
      await upsertNum(key, value);
    }

    const textUpdates: Record<string, string> = {
      earlybird_label: earlybirdLabel,
      starter_sublabel: starterSublabel,
      pro_sublabel: proSublabel,
      bisnis_sublabel: bisnisSublabel,
      starter_earlybird_badge: starterBadge,
      pro_earlybird_badge: proBadge,
      bisnis_earlybird_badge: bisnisBadge,
      announcement_banner_text: announcementBannerText,
      pricing_footer_text: pricingFooterText,
      hero_headline: heroHeadline,
      hero_subheadline: heroSubheadline,
      hero_subtext: heroSubtext,
      footer_tagline: footerTagline,
      contact_wa: contactWa,
      contact_email: contactEmail,
      admin_email: adminEmail,
      app_version: appVersion,
      in_app_announcement_text: inAppAnnouncementText,
      email_sender_address: emailSenderAddress,
      email_notification_subject: emailNotificationSubject,
      email_notification_template: emailNotificationTemplate,
      faq_data: JSON.stringify(faqs),
      testimonials_data: JSON.stringify(testimonials),
    };

    for (const [key, value] of Object.entries(textUpdates)) {
      await upsertText(key, value);
    }

    logActivity("edit_settings", "All settings saved");
    toast.success("Settings berhasil disimpan");
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </AdminLayout>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Settings</h2>

        {/* Operational Toggles */}
        <Section title="⚙️ Operational">
          <div className="flex items-center justify-between">
            <Label>🚧 Maintenance Mode</Label>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>
          <p className="text-[10px] text-muted-foreground">Landing page & app will show maintenance screen when ON</p>
          <div className="flex items-center justify-between">
            <Label>📢 In-App Announcement</Label>
            <Switch checked={inAppAnnouncementActive} onCheckedChange={setInAppAnnouncementActive} />
          </div>
          {inAppAnnouncementActive && (
            <div className="space-y-1">
              <Label className="text-xs">Announcement Text</Label>
              <Input value={inAppAnnouncementText} onChange={e => setInAppAnnouncementText(e.target.value)} placeholder="Banner text for logged-in users" />
            </div>
          )}
        </Section>

        {/* Announcement Banner */}
        <Section title="📣 Announcement Banner">
          <div className="flex items-center justify-between">
            <Label>Banner Aktif</Label>
            <Switch checked={announcementBannerActive} onCheckedChange={setAnnouncementBannerActive} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Banner Text ({"{slots}"} = remaining slots)</Label>
            <Input value={announcementBannerText} onChange={e => setAnnouncementBannerText(e.target.value)} />
          </div>
        </Section>

        {/* Early Bird */}
        <Section title="🐦 Early Bird">
          <div className="flex items-center justify-between">
            <Label>Early Bird Aktif</Label>
            <Switch checked={earlyBirdEnabled} onCheckedChange={setEarlyBirdEnabled} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Slots Taken (offset)</Label>
              <Input type="number" value={earlyBirdSlotsTaken} onChange={e => setEarlyBirdSlotsTaken(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Total Slots</Label>
              <Input type="number" value={earlyBirdTotalSlots} onChange={e => setEarlyBirdTotalSlots(Number(e.target.value))} />
            </div>
          </div>
        </Section>

        {/* Pricing - Starter */}
        <Section title="💰 Starter Plan">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Early Bird Price</Label>
              <Input type="number" value={priceStarterEarly} onChange={e => setPriceStarterEarly(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceStarterEarly)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Normal Price</Label>
              <Input type="number" value={priceStarterNormal} onChange={e => setPriceStarterNormal(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceStarterNormal)}</p>
            </div>
          </div>
        </Section>

        {/* Pricing - Pro */}
        <Section title="💰 Pro Plan">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Early Bird Price</Label>
              <Input type="number" value={priceProEarly} onChange={e => setPriceProEarly(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceProEarly)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Normal Price</Label>
              <Input type="number" value={priceProNormal} onChange={e => setPriceProNormal(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceProNormal)}</p>
            </div>
          </div>
        </Section>

        {/* Pricing - Bisnis */}
        <Section title="💰 Bisnis Plan">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Early Bird Price</Label>
              <Input type="number" value={priceBisnisEarly} onChange={e => setPriceBisnisEarly(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceBisnisEarly)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Normal Price</Label>
              <Input type="number" value={priceBisnisNormal} onChange={e => setPriceBisnisNormal(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceBisnisNormal)}</p>
            </div>
          </div>
        </Section>

        {/* Label & Badge */}
        <Section title="🏷️ Label & Badge">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Promo Label</Label>
              <Input value={earlybirdLabel} onChange={e => setEarlybirdLabel(e.target.value)} />
            </div>

            {/* Starter Plan */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Starter Plan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Badge</Label>
                  <Input value={starterBadge} onChange={e => setStarterBadge(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sublabel</Label>
                  <Input value={starterSublabel} onChange={e => setStarterSublabel(e.target.value)} placeholder="e.g., Rp 1.095/hari" />
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Pro Plan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Badge</Label>
                  <Input value={proBadge} onChange={e => setProBadge(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sublabel</Label>
                  <Input value={proSublabel} onChange={e => setProSublabel(e.target.value)} placeholder="e.g., Rp 1.916/hari" />
                </div>
              </div>
            </div>

            {/* Bisnis Plan */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Bisnis Plan</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Badge</Label>
                  <Input value={bisnisBadge} onChange={e => setBisnisBadge(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sublabel</Label>
                  <Input value={bisnisSublabel} onChange={e => setBisnisSublabel(e.target.value)} placeholder="e.g., Rp 3.287/hari" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-1">
              <Label className="text-xs">Pricing Footer Text</Label>
              <Input value={pricingFooterText} onChange={e => setPricingFooterText(e.target.value)} />
            </div>
          </div>
        </Section>

        {/* Hero Section */}
        <Section title="🏠 Hero Section">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Headline</Label>
              <Input value={heroHeadline} onChange={e => setHeroHeadline(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subheadline</Label>
              <Input value={heroSubheadline} onChange={e => setHeroSubheadline(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subtext (use **bold** for emphasis)</Label>
              <Textarea value={heroSubtext} onChange={e => setHeroSubtext(e.target.value)} rows={3} />
            </div>
          </div>
        </Section>

        {/* FAQ Management */}
        <Section title="❓ FAQ">
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">FAQ #{i + 1}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
                <Input value={faq.q} placeholder="Pertanyaan" onChange={e => {
                  const updated = [...faqs];
                  updated[i] = { ...updated[i], q: e.target.value };
                  setFaqs(updated);
                }} />
                <Textarea value={faq.a} placeholder="Jawaban" rows={2} onChange={e => {
                  const updated = [...faqs];
                  updated[i] = { ...updated[i], a: e.target.value };
                  setFaqs(updated);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => setFaqs([...faqs, { q: "", a: "" }])}>
              <Plus size={14} className="mr-1" /> Tambah FAQ
            </Button>
          </div>
        </Section>

        {/* Testimonials Management */}
        <Section title="⭐ Testimonials">
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Testimonial #{i + 1}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
                <Input value={t.name} placeholder="Nama" onChange={e => {
                  const u = [...testimonials]; u[i] = { ...u[i], name: e.target.value }; setTestimonials(u);
                }} />
                <Input value={t.kos} placeholder="Kos (lokasi)" onChange={e => {
                  const u = [...testimonials]; u[i] = { ...u[i], kos: e.target.value }; setTestimonials(u);
                }} />
                <Textarea value={t.quote} placeholder="Quote" rows={2} onChange={e => {
                  const u = [...testimonials]; u[i] = { ...u[i], quote: e.target.value }; setTestimonials(u);
                }} />
                <div className="space-y-1">
                  <Label className="text-xs">Bintang (1-5)</Label>
                  <Input type="number" min={1} max={5} value={t.stars} onChange={e => {
                    const u = [...testimonials]; u[i] = { ...u[i], stars: Number(e.target.value) }; setTestimonials(u);
                  }} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => setTestimonials([...testimonials, { quote: "", name: "", kos: "", stars: 5 }])}>
              <Plus size={14} className="mr-1" /> Tambah Testimonial
            </Button>
          </div>
        </Section>

        {/* Footer & Contact */}
        <Section title="📋 Footer & Contact">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Footer Tagline</Label>
              <Textarea value={footerTagline} onChange={e => setFooterTagline(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">WhatsApp Number</Label>
                <Input value={contactWa} onChange={e => setContactWa(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
            </div>
          </div>
        </Section>

        {/* Email Notifications */}
        <Section title="📧 Email Notifications">
          <div className="flex items-center justify-between">
            <Label>Enable Email Notifications</Label>
            <Switch checked={emailNotificationsEnabled} onCheckedChange={setEmailNotificationsEnabled} />
          </div>
          {emailNotificationsEnabled && (
            <div className="space-y-3 mt-3 pt-3 border-t border-border">
              <div className="space-y-1">
                <Label className="text-xs">Sender Email Address</Label>
                <Input value={emailSenderAddress} onChange={e => setEmailSenderAddress(e.target.value)} placeholder="noreply@kospintar.id" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email Subject Template</Label>
                <Input value={emailNotificationSubject} onChange={e => setEmailNotificationSubject(e.target.value)} placeholder="Notifikasi Tagihan Jatuh Tempo - {property_name}" />
                <p className="text-[10px] text-muted-foreground">Available variables: {"{property_name}"}, {"{tenant_name}"}, {"{due_date}"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email Body Template</Label>
                <Textarea value={emailNotificationTemplate} onChange={e => setEmailNotificationTemplate(e.target.value)} placeholder="Halo {tenant_name},&#10;&#10;Tagihan Anda akan jatuh tempo pada {due_date}.&#10;Jumlah: {amount_due}&#10;&#10;Mohon lakukan pembayaran segera." rows={6} />
                <p className="text-[10px] text-muted-foreground">Available variables: {"{tenant_name}"}, {"{amount_due}"}, {"{due_date}"}, {"{property_name}"}</p>
              </div>
            </div>
          )}
        </Section>

        {/* Admin & App */}
        <Section title="🔑 Admin & App">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Admin Email</Label>
              <Input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Note: changing this here only updates the setting, not the code guard</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">App Version</Label>
              <Input value={appVersion} onChange={e => setAppVersion(e.target.value)} />
            </div>
          </div>
        </Section>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : <><Save size={16} className="mr-2" /> Simpan Settings</>}
        </Button>
      </div>
    </AdminLayout>
  );
}
