import { Suspense } from "react";
import ScholarshipDiscovery from "@/components/scholarship-discovery";

async function ScholarshipSearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return <ScholarshipDiscovery initialQuery={q} />;
}

export default function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div role="status" aria-label="Loading scholarships" className="space-y-4">
          <span className="sr-only">Loading scholarships…</span>
          <div className="h-8 w-64 animate-pulse rounded-lg bg-[#e2e8f0]" />
          <div className="h-24 animate-pulse rounded-2xl bg-[#e2e8f0]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-2xl bg-[#e2e8f0]" />
            ))}
          </div>
        </div>
      }
    >
      <ScholarshipSearchResults searchParams={searchParams} />
    </Suspense>
  );
}
