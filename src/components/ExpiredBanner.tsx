import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { usePlan } from "@/lib/plan-context";
import { useDemo } from "@/lib/demo-context";

export default function ExpiredBanner() {
  const { isExpired } = usePlan();
  const { isDemo } = useDemo();
  const [dismissed, setDismissed] = useState(false);

  if (!isExpired || isDemo || dismissed) return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2.5 flex items-center gap-3">
      <AlertTriangle size={14} className="text-destructive shrink-0" />
      <p className="flex-1 text-xs font-medium text-foreground">
        Langganan Anda telah berakhir. Akun dalam mode baca-saja.{" "}
        <a href="/#harga" className="underline text-destructive font-semibold">
          Perbarui sekarang →
        </a>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Tutup"
      >
        <X size={14} />
      </button>
    </div>
  );
}
