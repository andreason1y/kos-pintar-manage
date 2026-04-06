import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg bg-card p-4 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}
