import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status?: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <Badge variant="outline" className="text-[10px]">-</Badge>;

  if (status === "lunas") {
    return (
      <Badge className="bg-[hsl(142,71%,45%)] text-white border-0 text-[10px] px-2 py-0.5 shadow-sm">
        Lunas
      </Badge>
    );
  }
  if (status === "belum_lunas") {
    return (
      <Badge className="bg-[hsl(38,92%,50%)] text-white border-0 text-[10px] px-2 py-0.5 shadow-sm">
        Belum Lunas
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive text-destructive-foreground border-0 text-[10px] px-2 py-0.5 shadow-sm">
      Belum Bayar
    </Badge>
  );
}
