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
          ? "border-[#e0e7ff] bg-[#e0e7ff] text-[#6366f1]"
          : "border-[#ddd6fe] text-[#868da0] hover:border-[#e0e7ff] hover:bg-[#ede9fe] hover:text-[#6366f1]"
      }`}
    >
      {saved ? <Check size={17} /> : <Bookmark size={17} />}
    </button>
  );
}
