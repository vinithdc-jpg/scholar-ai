"use client";

import { Bookmark, Check } from "lucide-react";
import { useSavedScholarships } from "@/components/saved-scholarships-provider";

export default function SaveScholarshipButton({
  scholarshipId,
  scholarshipName,
}: {
  scholarshipId: string;
  scholarshipName: string;
}) {
  const { savedIds, toggleSaved } = useSavedScholarships();
  const saved = savedIds.includes(scholarshipId);

  return (
    <button
      type="button"
      onClick={() => toggleSaved(scholarshipId)}
      aria-label={saved ? `Remove ${scholarshipName} from saved scholarships` : `Save ${scholarshipName}`}
      aria-pressed={saved}
      className={`grid size-10 shrink-0 place-items-center rounded-xl border transition ${
        saved
          ? "border-[#d1fae5] bg-[#d1fae5] text-[#059669]"
          : "border-[#e2e8f0] text-[#868da0] hover:border-[#d1fae5] hover:bg-[#f5f4ff] hover:text-[#059669]"
      }`}
    >
      {saved ? <Check size={17} /> : <Bookmark size={17} />}
    </button>
  );
}
