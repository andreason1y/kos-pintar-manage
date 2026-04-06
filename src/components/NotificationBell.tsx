import { useState, useMemo } from "react";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { useDemo } from "@/lib/demo-context";
import BottomSheet from "./BottomSheet";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const demo = useDemo();

  const now = new Date();
  const bulanIni = now.getMonth() + 1;
  const tahunIni = now.getFullYear();

  const notifications = useMemo(() => {
    if (!demo.isDemo) return [];

    const items: { id: string; type: "expiring" | "overdue"; title: string; subtitle: string }[] = [];

    // Expiring contracts (≤7 days)
    demo.tenants.filter(t => t.status === "aktif" && t.tanggal_keluar).forEach(t => {
      const days = Math.ceil((new Date(t.tanggal_keluar!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= 7) {
        items.push({
          id: t.id,
          type: "expiring",
          title: t.nama,
          subtitle: days === 0 ? "Kontrak habis hari ini" : `Kontrak habis dalam ${days} hari`,
        });
      }
    });

    // Overdue payments
    demo.transactions
      .filter(t => t.periode_bulan === bulanIni && t.periode_tahun === tahunIni && t.status !== "lunas")
      .forEach(tx => {
        const tenant = demo.tenants.find(t => t.id === tx.tenant_id);
        if (tenant) {
          items.push({
            id: tx.id,
            type: "overdue",
            title: tenant.nama,
            subtitle: tx.status === "belum_bayar" ? "Belum bayar bulan ini" : "Pembayaran belum lunas",
          });
        }
      });

    return items;
  }, [demo]);

  const count = notifications.length;

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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  n.type === "expiring" ? "bg-warning/20" : "bg-destructive/20"
                }`}>
                  {n.type === "expiring"
                    ? <Clock size={16} className="text-warning" />
                    : <AlertTriangle size={16} className="text-destructive" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
