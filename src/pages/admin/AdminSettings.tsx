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

interface SettingRow {
  id: string;
  key: string;
  value: number;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local editable state
  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(true);
  const [earlyBirdSlotsTaken, setEarlyBirdSlotsTaken] = useState(0);
  const [earlyBirdTotalSlots, setEarlyBirdTotalSlots] = useState(100);
  const [priceMandiriNormal, setPriceMandiriNormal] = useState(399000);
  const [priceJuraganNormal, setPriceJuraganNormal] = useState(799000);
  const [priceMandiriEarly, setPriceMandiriEarly] = useState(249000);
  const [priceJuraganEarly, setPriceJuraganEarly] = useState(499000);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("settings").select("*") as any;
      const rows = (data || []) as SettingRow[];
      setSettings(rows);
      const map: Record<string, number> = {};
      rows.forEach(r => { map[r.key] = r.value; });
      setEarlyBirdEnabled((map.early_bird_enabled ?? 1) === 1);
      setEarlyBirdSlotsTaken(map.early_bird_slots_taken ?? 0);
      setEarlyBirdTotalSlots(map.early_bird_total_slots ?? 100);
      setPriceMandiriNormal(map.price_mandiri_normal ?? 399000);
      setPriceJuraganNormal(map.price_juragan_normal ?? 799000);
      setPriceMandiriEarly(map.price_mandiri_early ?? 249000);
      setPriceJuraganEarly(map.price_juragan_early ?? 499000);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, number> = {
      early_bird_enabled: earlyBirdEnabled ? 1 : 0,
      early_bird_slots_taken: earlyBirdSlotsTaken,
      early_bird_total_slots: earlyBirdTotalSlots,
      price_mandiri_normal: priceMandiriNormal,
      price_juragan_normal: priceJuraganNormal,
      price_mandiri_early: priceMandiriEarly,
      price_juragan_early: priceJuraganEarly,
    };

    for (const [key, value] of Object.entries(updates)) {
      const existing = settings.find(s => s.key === key);
      if (existing) {
        await supabase.from("settings").update({ value } as any).eq("id", existing.id);
      } else {
        await supabase.from("settings").insert({ key, value } as any);
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

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Menyimpan...</> : <><Save size={16} className="mr-2" /> Simpan Settings</>}
        </Button>
      </div>
    </AdminLayout>
  );
}
