import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import ScholarshipCard from "@/components/scholarship-card";
import { Pill, ProgressBar, SectionHeading, Surface } from "@/components/ui";
import {
  applications,
  scholarships,
  upcomingDeadlines,
} from "@/lib/sample-data";

const stats = [
  {
    label: "Scholarships matched",
    value: "24",
    change: "+6 this week",
    icon: Sparkles,
    color: "bg-[#e0e7ff] text-[#6366f1]",
  },
  {
    label: "Potential funding",
    value: "$48.5k",
    change: "Across your matches",
    icon: Award,
    color: "bg-[#fef3c7] text-[#f59e0b]",
  },
  {
    label: "Applications started",
    value: "3",
    change: "1 ready to submit",
    icon: FileCheck2,
    color: "bg-[#eef2ff] text-[#312e81]",
  },
  {
    label: "Profile strength",
    value: "72%",
    change: "A few details to go",
    icon: TrendingUp,
    color: "bg-[#e0e7ff] text-[#312e81]",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[26px] bg-[#312e81] px-5 py-7 text-white shadow-[0_16px_34px_rgba(15,23,42,0.12)] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-20 size-60 rounded-full border border-indigo-300/10"
        />
        <div
          aria-hidden="true"
          className="absolute right-16 -top-14 size-44 rounded-full border border-indigo-300/10"
        />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-155">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-400/15 px-3 py-1.5 text-[11px] font-semibold text-indigo-200">
              <Sparkles size={12} /> Your student workspace
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tighter sm:text-[36px] lg:text-[40px]">
              Good morning, Jordan <span aria-hidden="true">✦</span>
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-slate-300 sm:text-[16px]">
              You have{" "}
              <strong className="font-bold text-white">
                4 new scholarship matches
              </strong>{" "}
              and one deadline coming up. Let’s make today count.
            </p>
          </div>
          <Link
            href="/scholarships"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-3 text-[12px] font-bold text-white shadow-sm shadow-indigo-950/20 transition hover:bg-[#312e81] sm:px-5 sm:text-[13px]"
          >
            Explore matches <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section
        aria-label="Your scholarship overview"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, change, icon: Icon, color }) => (
          <Surface key={label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-medium text-[#8990a2]">{label}</p>
              <span
                className={`grid size-9 place-items-center rounded-xl ${color}`}
              >
                <Icon size={17} />
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="text-[27px] font-extrabold leading-none tracking-tighter text-[#0f172a] dark:text-white">
                {value}
              </p>
              <span className="flex items-center gap-1 text-[10px] font-medium text-[#312e81]">
                <TrendingUp size={12} /> {change}
              </span>
            </div>
          </Surface>
        ))}
      </section>

      <section>
        <SectionHeading
          title="Picked for you"
          description="A few opportunities that line up with your profile."
          action={
            <Link
              href="/scholarships"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6366f1] hover:underline"
            >
              See all matches <ArrowRight size={13} />
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {scholarships.slice(0, 3).map((scholarship) => (
            <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div>
          <SectionHeading
            title="Application progress"
            description="Keep an eye on the opportunities you’ve started."
            action={
              <Link
                href="/applications"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6366f1] hover:underline"
              >
                View tracker <ArrowRight size={13} />
              </Link>
            }
          />
          <Surface className="overflow-hidden">
            <div className="hidden grid-cols-[1.45fr_0.75fr_1fr_auto] gap-4 border-b border-[#ddd6fe] bg-[#f5f3ff] px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-[#9ba1b0] sm:grid">
              <span>Scholarship</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Deadline</span>
            </div>
            <div className="divide-y divide-[#ddd6fe]">
              {applications.map((application) => (
                <div
                  key={application.title}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[1.45fr_0.75fr_1fr_auto] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold text-[#0f172a] dark:text-white">
                      {application.title}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-[#979eae]">
                      {application.provider}
                    </p>
                  </div>
                  <div>
                    <Pill tone={application.tone}>{application.status}</Pill>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ProgressBar value={application.progress} />
                    <span className="text-[10px] font-semibold text-[#767e92]">
                      {application.progress}%
                    </span>
                  </div>
                  <span className="text-[10px] text-[#82899a]">
                    {application.date}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/applications"
              className="flex items-center justify-between border-t border-[#ddd6fe] px-5 py-3 text-[11px] font-semibold text-[#6366f1] hover:bg-[#f5f3ff]"
            >
              Open application tracker <ChevronRight size={15} />
            </Link>
          </Surface>
        </div>

        <div>
          <SectionHeading
            title="Coming up"
            description="A little reminder for your calendar."
          />
          <Surface className="p-5">
            <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-[#fef3c7] p-3.5">
              <span className="grid size-9 place-items-center rounded-xl bg-white text-[#f59e0b] shadow-sm">
                <Clock3 size={17} />
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#92400e]">
                  Your next deadline is close
                </p>
                <p className="mt-0.5 text-[10px] text-[#92400e]">
                  Bright Futures closes in 12 days
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.title} className="flex items-center gap-3">
                  <span className={`size-2 rounded-full ${deadline.color}`} />
                  <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#565d72]">
                    {deadline.title}
                  </p>
                  <span className="text-[10px] text-[#949bad]">
                    {deadline.date}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/applications"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[#ddd6fe] py-2.5 text-[11px] font-semibold text-[#6d7489] transition hover:border-[#e0e7ff] hover:text-[#6366f1]"
            >
              <CalendarDays size={14} /> Open my deadlines
            </Link>
          </Surface>
        </div>
      </section>

      <Surface className="flex flex-wrap items-center justify-between gap-4 bg-linear-to-r from-[#f5f3ff] to-white p-5 sm:px-6 dark:from-[#17172f] dark:to-[#17172f]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e0e7ff] text-[#6366f1]">
            <CheckCircle2 size={19} />
          </span>
          <div>
            <p className="text-[12px] font-bold text-[#0f172a] dark:text-white">
              Make your matches even better
            </p>
            <p className="mt-1 text-[10px] text-[#8990a2]">
              Add a couple more details to your profile.
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6366f1] hover:underline"
        >
          Complete profile <ArrowUpRight size={14} />
        </Link>
      </Surface>
    </div>
  );
}
