import { Surface } from "@/components/ui";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e2e8f0] ${className}`} />;
}

export default function WorkspaceLoading() {
  return (
    <div role="status" aria-label="Loading workspace" className="space-y-7">
      <span className="sr-only">Loading your workspace…</span>
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-3 w-80 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Surface key={index} className="space-y-4 p-5"><Skeleton className="h-3 w-28" /><Skeleton className="h-7 w-20" /><Skeleton className="h-2 w-32" /></Surface>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <Surface key={index} className="space-y-4 p-5"><Skeleton className="h-11 w-11 rounded-xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-10 w-full rounded-xl" /></Surface>)}
      </div>
    </div>
  );
}
