"use client";

import { Bookmark, Check } from "lucide-react";
import { useSavedScholarships } from "@/components/saved-scholarships-provider";
import type { Scholarship } from "@/lib/sample-data";

export default function SaveScholarshipButton({
  scholarship,
}: {
  scholarship: Scholarship;
}) {
  const { savedIds, pendingIds, isLoading, toggleSaved } =
    useSavedScholarships();
  const saved = savedIds.includes(scholarship.id);
  const isPending = pendingIds.includes(scholarship.id);

  return (
    <button
      type="button"
      onClick={() => void toggleSaved(scholarship)}
      disabled={isPending || isLoading}
      aria-label={
        saved
          ? `Remove ${scholarship.name} from saved scholarships`
          : `Save ${scholarship.name}`
      }
      aria-pressed={saved}
      className={`grid size-10 shrink-0 place-items-center rounded-xl border transition ${
        saved
          ? "border-[#e0e7ff] bg-[#e0e7ff] text-[#6366f1]"
          : "border-[#ddd6fe] text-[#868da0] hover:border-[#e0e7ff] hover:bg-[#ede9fe] hover:text-[#6366f1]"
      } disabled:cursor-wait disabled:opacity-60`}
    >
      {saved ? <Check size={17} /> : <Bookmark size={17} />}
    </button>
  );
}
