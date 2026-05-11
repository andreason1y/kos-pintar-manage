import { useState, useMemo } from "react";
import { Bell, AlertTriangle, Clock, MessageCircle, Megaphone } from "lucide-react";
import { useDemo } from "@/lib/demo-context";
import { useProperty } from "@/lib/property-context";
import { useReminders, useBroadcasts, useTenants } from "@/hooks/use-queries";
import { formatRupiah } from "@/lib/helpers";
import BottomSheet from "./BottomSheet";
import { Button } from "./ui/button";

interface Notification {
  id: string;
  type: "expiring" | "overdue" | "reminder" | "broadcast";
  title: string;
  subtitle: string;
  waLink?: string | null;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const demo = useDemo();
  const { activeProperty } = useProperty();

  const now = new Date();
  const bulanIni = now.getMonth() + 1;
  const tahunIni = now.getFullYear();

  // Demo notifications
  const demoNotifications = useMemo(() => {
    if (!demo.isDemo) return [];
    const items: Notification[] = [];
    demo.tenants.filter(t => t.status === "aktif" && t.tanggal_keluar).forEach(t => {
      const days = Math.ceil((new Date(t.tanggal_keluar!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= 7) {
        items.push({ id: `exp-${t.id}`, type: "expiring", title: t.nama, subtitle: days === 0 ? "Kontrak habis hari ini" : `Kontrak habis dalam ${days} hari` });
      }
    });
    demo.transactions.filter(t => t.periode_bulan === bulanIni && t.periode_tahun === tahunIni && t.status !== "lunas").forEach(tx => {
      const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
      if (tenant) {
        const sisa = tx.total_tagihan - tx.jumlah_dibayar;
        const phone = tenant.no_hp ? tenant.no_hp.replace(/^0/, "62") : "";
        items.push({ id: `ov-${tx.id}`, type: "overdue", title: tenant.nama, subtitle: tx.status === "belum_bayar" ? "Belum bayar bulan ini" : "Pembayaran belum lunas", waLink: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Halo ${tenant.nama}, tagihan sewa bulan ini sebesar ${formatRupiah(sisa)}. Mohon segera dibayar. 🙏`)}` : null });
      }
    });
    const demoTenant = demo.tenants.find(t => t.status === "aktif");
    if (demoTenant) {
      const phone = demoTenant.no_hp ? demoTenant.no_hp.replace(/^0/, "62") : "";
      items.push({ id: `rem-h3-${demoTenant.id}`, type: "reminder", title: demoTenant.nama, subtitle: "Tagihan jatuh tempo 3 hari lagi", waLink: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(`Halo ${demoTenant.nama}, tagihan sewa jatuh tempo 3 hari lagi. Mohon segera dibayar.`)}` : null });
    }
    return items;
  }, [demo]);

  // React Query hooks for real data
  const { data: reminderData } = useReminders(bulanIni, tahunIni);
  const { data: broadcastData } = useBroadcasts();
  const { data: tenantData } = useTenants();

  const notifications = useMemo(() => {
    if (demo.isDemo) return demoNotifications;
    const items: Notification[] = [];

    // Broadcasts
    (broadcastData || []).forEach(b => {
      items.push({ id: `bc-${b.id}`, type: "broadcast", title: "Pengumuman", subtitle: b.message });
    });

    // Reminders
    const tenantMap: Record<string, string> = {};
    (tenantData || []).forEach(t => { tenantMap[t.id] = t.nama; });
    (reminderData || []).forEach(r => {
      items.push({ id: r.id, type: "reminder", title: tenantMap[r.tenant_id] || "Penyewa", subtitle: r.message, waLink: r.wa_link });
    });

    return items;
  }, [demo.isDemo, demoNotifications, reminderData, broadcastData, tenantData]);

  const count = notifications.length;

  const iconForType = (type: string) => {
    if (type === "expiring") return <Clock size={16} className="text-warning" />;
    if (type === "reminder") return <MessageCircle size={16} className="text-foreground" />;
    if (type === "broadcast") return <Megaphone size={16} className="text-accent" />;
    return <AlertTriangle size={16} className="text-destructive" />;
  };

  const bgForType = (type: string) => {
    if (type === "expiring") return "bg-warning/10";
    if (type === "reminder") return "bg-foreground/5";
    if (type === "broadcast") return "bg-accent/10";
    return "bg-destructive/10";
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-2 rounded-full hover:bg-muted transition-colors">
        <Bell size={20} className="text-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={`Notifikasi (${count})`}>
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Tidak ada notifikasi</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgForType(n.type)}`}>
                  {iconForType(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.subtitle}</p>
                </div>
                {n.waLink && (
                  <a href={n.waLink} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                      <MessageCircle size={12} /> WA
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
