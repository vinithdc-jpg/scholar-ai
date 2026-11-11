"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, CircleDashed, Clock3, FileCheck2, Plus } from "lucide-react";
import { Pill, ProgressBar, Surface } from "@/components/ui";
import { applications } from "@/lib/sample-data";

export default function ApplicationsPage() {
  const [filter, setFilter] = useState("All applications");
  const options = ["All applications", "In progress", "Submitted", "Draft"];
  const filtered = applications.filter((item) => filter === "All applications" || item.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#059669]">Your progress, all in one place</p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.05em] text-[#0f172a] dark:text-white sm:text-[31px]">Application tracker</h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">Stay organized and feel good about every next step.</p>
        </div>
        <Link href="/scholarships" className="inline-flex items-center gap-2 rounded-xl bg-[#059669] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#047857]"><Plus size={14} /> Start an application</Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "In progress", value: "2", icon: CircleDashed, color: "bg-[#d1fae5] text-[#059669]" },
          { label: "Submitted", value: "1", icon: CheckCircle2, color: "bg-[#eaf8f2] text-[#047857]" },
          { label: "Upcoming deadlines", value: "3", icon: CalendarDays, color: "bg-[#fff4e8] text-[#e2a04b]" },
        ].map(({ label, value, icon: Icon, color }) => <Surface key={label} className="flex items-center gap-3 p-4"><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon size={18} /></span><div><p className="text-[10px] text-[#9299aa]">{label}</p><p className="mt-0.5 text-[20px] font-extrabold tracking-[-0.04em] text-[#0f172a] dark:text-white">{value}</p></div></Surface>)}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">Your applications</h2><p className="mt-1 text-[10px] text-[#8a91a1]">Keep each application moving at your own pace.</p></div>
        <label className="flex items-center gap-2 text-[10px] font-semibold text-[#8b92a2]">Show
          <select aria-label="Filter applications" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-[#e2e8f0] bg-white px-2.5 py-2 text-[10px] text-[#555d71] outline-none">
            {options.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 space-y-3">
        {filtered.map((item, index) => (
          <Surface key={item.title} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${index === 1 ? "bg-[#eaf8f2] text-[#047857]" : "bg-[#d1fae5] text-[#059669]"}`}><FileCheck2 size={18} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="text-[12px] font-bold text-[#0f172a] dark:text-white">{item.title}</h3><Pill tone={item.tone}>{item.status}</Pill></div>
                <p className="mt-1 text-[10px] text-[#9299aa]">{item.provider}</p>
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-medium ${index === 0 ? "text-[#ce8b3c]" : "text-[#8b92a3]"}`}><Clock3 size={12} /> Due {item.date}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="flex items-center gap-3"><ProgressBar value={item.progress} color={item.progress === 100 ? "bg-[#047857]" : undefined} /><span className="text-[10px] font-semibold text-[#767e92]">{item.progress}%</span></div>
              <Link href={`/scholarships/${item.id}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#059669] hover:underline">Continue <ChevronRight size={13} /></Link>
            </div>
            {item.status === "In progress" && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#d1fae5] px-3.5 py-2.5"><p className="flex items-center gap-2 text-[10px] text-[#787f94]"><span className="size-1.5 rounded-full bg-[#059669]" /> Next up: personal statement</p><Link href="/assistant" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#059669]">Get writing help <ArrowUpRight size={12} /></Link></div>}
          </Surface>
        ))}
        {filtered.length === 0 && <Surface className="px-6 py-12 text-center"><FileCheck2 className="mx-auto text-[#aaaebb]" size={22} /><p className="mt-3 text-[12px] font-semibold text-[#60677b]">No applications in this category yet.</p><Link href="/scholarships" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#059669]">Find an opportunity <ArrowUpRight size={12} /></Link></Surface>}
      </div>
    </div>
  );
}
