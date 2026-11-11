"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Sparkles } from "lucide-react";
import type { Scholarship } from "@/lib/sample-data";
import { Pill } from "@/components/ui";
import SaveScholarshipButton from "@/components/save-scholarship-button";

export default function ScholarshipCard({
  scholarship,
}: {
  scholarship: Scholarship;
}) {
  return (
    <article className="workspace-surface group flex h-full flex-col rounded-2xl border border-[#ddd6fe] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#e0e7ff] hover:shadow-[0_12px_35px_rgba(47,48,100,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${scholarship.color} text-[12px] font-bold text-white shadow-sm`}>
            {scholarship.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-[#9299aa]">{scholarship.provider}</p>
            <p className="mt-0.5 text-[14px] font-bold leading-snug text-[#0f172a] dark:text-white">{scholarship.name}</p>
          </div>
        </div>
        <SaveScholarshipButton scholarshipId={scholarship.id} scholarshipName={scholarship.name} />
      </div>
      <p className="mt-4 line-clamp-2 min-h-10 text-[12px] leading-5 text-[#858ca0]">{scholarship.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Pill tone="purple"><Sparkles size={11} className="mr-1" /> {scholarship.match}% match</Pill>
        <Pill>{scholarship.category}</Pill>
      </div>
      <div className="my-4 flex items-end justify-between border-t border-[#ddd6fe] pt-4">
        <div>
          <p className="text-[10px] text-[#9ba1b0]">Award amount</p>
          <p className="mt-0.5 text-[20px] font-extrabold tracking-[-0.04em] text-[#0f172a] dark:text-white">{scholarship.amount}</p>
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-1 text-[10px] text-[#9ba1b0]"><CalendarDays size={11} /> Deadline</p>
          <p className={`mt-1 text-[11px] font-semibold ${scholarship.daysLeft <= 14 ? "text-[#f59e0b]" : "text-[#656d81]"}`}>
            {scholarship.deadline}
          </p>
        </div>
      </div>
      <Link
        href={`/scholarships/${scholarship.id}`}
        className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#f5f3ff] px-4 py-2.5 text-[12px] font-bold text-[#6366f1] transition hover:bg-[#e0e7ff] group-hover:bg-[#6366f1] group-hover:text-white"
      >
        View scholarship <ArrowUpRight size={14} />
      </Link>
    </article>
  );
}
