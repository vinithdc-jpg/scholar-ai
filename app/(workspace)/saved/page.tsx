"use client";

import Link from "next/link";
import { Bookmark, Compass, Search } from "lucide-react";
import ScholarshipCard from "@/components/scholarship-card";
import { useSavedScholarships } from "@/components/saved-scholarships-provider";
import { scholarships } from "@/lib/sample-data";

export default function SavedPage() {
  const { savedIds } = useSavedScholarships();
  const savedScholarships = scholarships.filter((scholarship) => savedIds.includes(scholarship.id));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">Your shortlist</p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.05em] text-[#0f172a] dark:text-white sm:text-[31px]">Saved scholarships</h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">Keep the opportunities you love close at hand.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e0e7ff] px-3 py-1.5 text-[10px] font-semibold text-[#6366f1]"><Bookmark size={12} /> {savedScholarships.length} saved</span>
      </div>
      {savedScholarships.length > 0 && <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {savedScholarships.map((scholarship) => <ScholarshipCard key={scholarship.id} scholarship={scholarship} />)}
      </div>}
      {savedScholarships.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-[#ddd6fe] bg-white px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e0e7ff] text-[#6366f1]"><Bookmark size={20} /></span>
          <h2 className="mt-4 text-[15px] font-bold text-[#0f172a]">Your shortlist is ready when you are</h2>
          <p className="mt-2 text-[12px] text-[#858c9e]">Save scholarships that catch your eye and compare them here.</p>
          <Link href="/scholarships" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[11px] font-bold text-white"><Search size={13} /> Explore scholarships</Link>
        </div>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#ddd6fe] bg-white p-5">
        <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#eef2ff] text-[#6366f1]"><Compass size={17} /></span><div><p className="text-[11px] font-bold text-[#0f172a] dark:text-white">Found something new?</p><p className="mt-1 text-[10px] text-[#8e95a5]">Keep discovering opportunities that fit your plans.</p></div></div>
        <Link href="/scholarships" className="text-[11px] font-bold text-[#6366f1] hover:underline">Browse matches →</Link>
      </div>
    </div>
  );
}
