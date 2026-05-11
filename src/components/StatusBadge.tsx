import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status?: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return <Badge variant="outline" className="text-[10px] font-medium">-</Badge>;

  if (status === "lunas") {
    return (
      <Badge className="bg-success text-white border-0 text-[10px] px-2 py-0.5 font-medium">
        Lunas
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive text-destructive-foreground border-0 text-[10px] px-2 py-0.5 font-medium">
      Belum Bayar
    </Badge>
  );
}
