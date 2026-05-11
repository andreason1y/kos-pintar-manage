import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5 rounded" style={{ width: `${85 - i * 15}%` }} />
      ))}
    </div>
  );
}
