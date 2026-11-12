"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#fef3c7] text-[#f59e0b]">
        <AlertTriangle size={21} />
      </span>
      <h1 className="mt-4 text-[18px] font-bold text-[#0f172a] dark:text-white">
        We couldn’t load this page
      </h1>
      <p className="mt-2 max-w-[360px] text-[11px] leading-5 text-[#858c9e]">
        Something went wrong while opening this section. Try again, or head back
        to your dashboard.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[10px] font-bold text-white hover:bg-[#312e81]"
        >
          <RefreshCw size={13} /> Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-[#ddd6fe] bg-white px-4 py-2.5 text-[10px] font-semibold text-[#6d7489] hover:bg-[#e0e7ff]"
        >
          <ArrowLeft size={13} /> Dashboard
        </Link>
      </div>
    </div>
  );
}
