import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatRupiah } from "@/lib/helpers";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface SettingRow { id: string; key: string; value: number; }
interface SettingTextRow { id: string; key: string; value: string; }

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [settingsText, setSettingsText] = useState<SettingTextRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Numeric settings
  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(true);
  const [earlyBirdSlotsTaken, setEarlyBirdSlotsTaken] = useState(0);
  const [earlyBirdTotalSlots, setEarlyBirdTotalSlots] = useState(100);
  const [priceMandiriNormal, setPriceMandiriNormal] = useState(499000);
  const [priceJuraganNormal, setPriceJuraganNormal] = useState(999000);
  const [priceMandiriEarly, setPriceMandiriEarly] = useState(249000);
  const [priceJuraganEarly, setPriceJuraganEarly] = useState(499000);

  // Text settings
  const [earlybirdLabel, setEarlybirdLabel] = useState("Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama");
  const [mandiriSublabel, setMandiriSublabel] = useState("Kurang dari Rp 700/hari");
  const [juraganSublabel, setJuraganSublabel] = useState("");
  const [mandiriBadge, setMandiriBadge] = useState("🔥 Early Bird");
  const [juraganBadge, setJuraganBadge] = useState("🔥 Early Bird — Kos Besar");

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
      setEarlyBirdEnabled((map.earlybird_active ?? map.early_bird_enabled ?? 1) === 1);
      setEarlyBirdSlotsTaken(map.early_bird_slots_taken ?? 0);
      setEarlyBirdTotalSlots(map.earlybird_slots_total ?? map.early_bird_total_slots ?? 100);
      setPriceMandiriNormal(map.mandiri_price_normal ?? map.price_mandiri_normal ?? 499000);
      setPriceJuraganNormal(map.juragan_price_normal ?? map.price_juragan_normal ?? 999000);
      setPriceMandiriEarly(map.mandiri_price_earlybird ?? map.price_mandiri_early ?? 249000);
      setPriceJuraganEarly(map.juragan_price_earlybird ?? map.price_juragan_early ?? 499000);

      const tmap: Record<string, string> = {};
      textRows.forEach(r => { tmap[r.key] = r.value; });
      setEarlybirdLabel(tmap.earlybird_label ?? "Hemat 50% + bonus 3 bulan untuk 100 pendaftar pertama");
      setMandiriSublabel(tmap.mandiri_sublabel ?? "Kurang dari Rp 700/hari");
      setJuraganSublabel(tmap.juragan_sublabel ?? "");
      setMandiriBadge(tmap.mandiri_earlybird_badge ?? "🔥 Early Bird");
      setJuraganBadge(tmap.juragan_earlybird_badge ?? "🔥 Early Bird — Kos Besar");

      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    // Save numeric settings
    const numUpdates: Record<string, number> = {
      earlybird_active: earlyBirdEnabled ? 1 : 0,
      early_bird_slots_taken: earlyBirdSlotsTaken,
      earlybird_slots_total: earlyBirdTotalSlots,
      mandiri_price_normal: priceMandiriNormal,
      juragan_price_normal: priceJuraganNormal,
      mandiri_price_earlybird: priceMandiriEarly,
      juragan_price_earlybird: priceJuraganEarly,
    };

    for (const [key, value] of Object.entries(numUpdates)) {
      const existing = settings.find(s => s.key === key);
      if (existing) {
        await supabase.from("settings").update({ value } as any).eq("id", existing.id);
      } else {
        await supabase.from("settings").insert({ key, value } as any);
      }
    }

    // Save text settings
    const textUpdates: Record<string, string> = {
      earlybird_label: earlybirdLabel,
      mandiri_sublabel: mandiriSublabel,
      juragan_sublabel: juraganSublabel,
      mandiri_earlybird_badge: mandiriBadge,
      juragan_earlybird_badge: juraganBadge,
    };

    for (const [key, value] of Object.entries(textUpdates)) {
      const existing = settingsText.find(s => s.key === key);
      if (existing) {
        await supabase.from("settings_text").update({ value } as any).eq("id", existing.id);
      } else {
        await supabase.from("settings_text").insert({ key, value } as any);
      }
    }

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Settings</h2>

        {/* Early Bird */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Early Bird</h3>
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
        </div>

        {/* Harga Early Bird */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Harga Early Bird</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mandiri Early Bird</Label>
              <Input type="number" value={priceMandiriEarly} onChange={e => setPriceMandiriEarly(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceMandiriEarly)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Juragan Early Bird</Label>
              <Input type="number" value={priceJuraganEarly} onChange={e => setPriceJuraganEarly(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceJuraganEarly)}</p>
            </div>
          </div>
        </div>

        {/* Harga Normal */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Harga Normal</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mandiri Normal</Label>
              <Input type="number" value={priceMandiriNormal} onChange={e => setPriceMandiriNormal(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceMandiriNormal)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Juragan Normal</Label>
              <Input type="number" value={priceJuraganNormal} onChange={e => setPriceJuraganNormal(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">{formatRupiah(priceJuraganNormal)}</p>
            </div>
          </div>
        </div>

        {/* Label & Badge Text */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Label & Badge</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Promo Label (di bawah harga)</Label>
              <Input value={earlybirdLabel} onChange={e => setEarlybirdLabel(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mandiri Badge</Label>
                <Input value={mandiriBadge} onChange={e => setMandiriBadge(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Juragan Badge</Label>
                <Input value={juraganBadge} onChange={e => setJuraganBadge(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mandiri Sublabel</Label>
                <Input value={mandiriSublabel} onChange={e => setMandiriSublabel(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Juragan Sublabel</Label>
                <Input value={juraganSublabel} onChange={e => setJuraganSublabel(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : <><Save size={16} className="mr-2" /> Simpan Settings</>}
        </Button>
      </div>
    </AdminLayout>
  );
}
