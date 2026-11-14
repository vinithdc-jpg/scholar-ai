import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import SaveScholarshipButton from "@/components/save-scholarship-button";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Share2,
  Sparkles,
} from "lucide-react";
import { Pill, Surface } from "@/components/ui";
import { scholarships } from "@/lib/sample-data";
import { getDatabasePool } from "@/lib/db";
import { scholarshipFields } from "@/lib/api/scholarships";
import {
  toScholarshipDisplay,
  type ScholarshipRecord,
} from "@/lib/scholarship-display";

type ScholarshipDetailsProps = {
  params: Promise<{ id: string }>;
};

export default function ScholarshipDetailsPage({
  params,
}: ScholarshipDetailsProps) {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading scholarship details"
          className="space-y-4"
        >
          <span className="sr-only">Loading scholarship details…</span>
          <div className="h-56 animate-pulse rounded-2xl bg-[#ddd6fe]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[#ddd6fe]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[#ddd6fe]" />
        </div>
      }
    >
      <ScholarshipDetailsContent params={params} />
    </Suspense>
  );
}

async function ScholarshipDetailsContent({ params }: ScholarshipDetailsProps) {
  const { id } = await params;
  let scholarship = scholarships.find((item) => item.id === id);
  if (!scholarship && /^\d+$/.test(id)) {
    const result = await getDatabasePool().query<ScholarshipRecord>(
      `SELECT id, ${scholarshipFields.join(", ")},
       submitted_by IS NOT NULL AND verification_status = 'pending' AS is_community_submitted
       FROM scholarships
       WHERE id = $1 AND status = 'published'
         AND (verification_status = 'verified'
           OR (submitted_by IS NOT NULL AND verification_status = 'pending'))`,
      [id],
    );
    if (result.rows[0]) {
      scholarship = toScholarshipDisplay(result.rows[0]);
    }
  }
  if (!scholarship) notFound();

  return (
    <div className="mx-auto max-w-262.5">
      <Link
        href="/scholarships"
        className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#767e91] hover:text-[#6366f1]"
      >
        <ArrowLeft size={14} /> Back to scholarships
      </Link>
      <div className="grid gap-5 lg:grid-cols-[1fr_310px]">
        <div className="space-y-5">
          <Surface className="overflow-hidden">
            <div className={`h-2 bg-linear-to-r ${scholarship.color}`} />
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br ${scholarship.color} text-[13px] font-bold text-white`}
                  >
                    {scholarship.initials}
                  </div>
                  <div>
                    <p className="text-[11px] text-[#949bad]">
                      {scholarship.provider}
                    </p>
                    <h1 className="mt-1 text-[23px] font-extrabold leading-tight tracking-tighter text-[#0f172a] dark:text-white sm:text-[28px]">
                      {scholarship.name}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {scholarship.match !== undefined && (
                        <Pill tone="purple">
                          <Sparkles size={11} className="mr-1" />{" "}
                          {scholarship.match}% match
                        </Pill>
                      )}
                      <Pill>{scholarship.category}</Pill>
                      {scholarship.isCommunitySubmitted && (
                        <Pill tone="amber">Community · unverified</Pill>
                      )}
                    </div>
                  </div>
                </div>
                <SaveScholarshipButton
                  scholarshipId={scholarship.id}
                  scholarshipName={scholarship.name}
                />
              </div>
              <p className="mt-6 text-[12px] leading-6 text-[#747c91]">
                {scholarship.description}
              </p>
              <div className="mt-6 grid gap-3 border-t border-[#ddd6fe] pt-5 sm:grid-cols-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#e0e7ff] text-[#6366f1]">
                    <GraduationCap size={17} />
                  </span>
                  <div>
                    <p className="text-[9px] text-[#9ba1b0]">Award amount</p>
                    <p className="mt-0.5 text-[12px] font-bold text-[#0f172a] dark:text-white">
                      {scholarship.amount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#fef3c7] text-[#f59e0b]">
                    <CalendarDays size={17} />
                  </span>
                  <div>
                    <p className="text-[9px] text-[#9ba1b0]">
                      Application deadline
                    </p>
                    <p className="mt-0.5 text-[12px] font-bold text-[#0f172a] dark:text-white">
                      {scholarship.deadline}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#eef2ff] text-[#312e81]">
                    <MapPin size={17} />
                  </span>
                  <div>
                    <p className="text-[9px] text-[#9ba1b0]">Location</p>
                    <p className="mt-0.5 text-[12px] font-bold text-[#0f172a] dark:text-white">
                      {scholarship.location ?? "United States"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#eef2ff] text-[#312e81]">
                <CheckCircle2 size={16} />
              </span>
              <h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">
                Eligibility requirements
              </h2>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#8b92a3]">
              Review these requirements to see whether this opportunity is right
              for you.
            </p>
            {scholarship.eligibility.length ? (
              <ul className="mt-4 space-y-3">
                {scholarship.eligibility.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[12px] text-[#626a7f]"
                >
                  <CheckCircle2
                    size={15}
                    className="mt-0.5 shrink-0 text-[#312e81]"
                  />{" "}
                  {item}
                </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[12px] text-[#858c9e]">
                No eligibility details were provided.
              </p>
            )}
          </Surface>

          {scholarship.benefits.length > 0 && (
            <Surface className="p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fef3c7] text-[#f59e0b]">
                <Sparkles size={16} />
              </span>
              <h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">
                What this award includes
              </h2>
            </div>
            <ul className="mt-4 space-y-3">
              {scholarship.benefits.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[12px] text-[#626a7f]"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#6366f1]" />{" "}
                  {item}
                </li>
              ))}
            </ul>
            </Surface>
          )}

          {scholarship.documents.length > 0 && (
            <Surface className="p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#f2efff] text-[#312e81]">
                <FileText size={16} />
              </span>
              <h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">
                Documents to prepare
              </h2>
            </div>
            <div className="mt-4 space-y-2.5">
              {scholarship.documents.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#ddd6fe] px-3.5 py-3"
                >
                  <span className="flex items-center gap-2.5 text-[11px] text-[#636b80]">
                    <span className="grid size-6 place-items-center rounded-lg bg-[#f5f3ff] text-[9px] font-bold text-[#9399a9]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </span>
                  <Download size={14} className="shrink-0 text-[#b1b6c2]" />
                </div>
              ))}
            </div>
            </Surface>
          )}
        </div>

        <aside className="space-y-4">
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#9299aa]">Award value</p>
                <p className="mt-1 text-[30px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white">
                  {scholarship.amount}
                </p>
              </div>
              <span className="grid size-11 place-items-center rounded-xl bg-[#e0e7ff] text-[#6366f1]">
                <GraduationCap size={20} />
              </span>
            </div>
            <div className="mt-4 rounded-xl bg-[#fef3c7] p-3.5">
              <p className="flex items-center gap-2 text-[11px] font-bold text-[#8f652b]">
                <Clock3 size={14} />{" "}
                {scholarship.daysLeft === Number.MAX_SAFE_INTEGER
                  ? "No deadline set"
                  : scholarship.daysLeft < 0
                    ? "Deadline passed"
                    : `Deadline in ${scholarship.daysLeft} days`}
              </p>
              <p className="mt-1.5 text-[10px] text-[#a38863]">
                {scholarship.deadline === "No deadline"
                  ? "Check the provider's source for current dates."
                  : `Apply before ${scholarship.deadline}`}
              </p>
            </div>
            <a
              href={
                scholarship.officialApplicationUrl ??
                scholarship.officialSourceUrl ??
                "https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx"
              }
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] px-4 py-3 text-[11px] font-bold text-white transition hover:bg-[#312e81]"
            >
              {scholarship.officialApplicationUrl
                ? "Go to application"
                : "View official source"}{" "}
              <ExternalLink size={14} />
            </a>
            <p className="mt-2 text-center text-[9px] leading-4 text-[#9ba1b0]">
              {scholarship.isCommunitySubmitted
                ? "Community-submitted and not yet verified. Confirm details with the provider."
                : scholarship.officialSourceUrl
                  ? "Confirm current details with the scholarship provider."
                  : "Sample opportunity. Always verify details with the scholarship provider."}
            </p>
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ddd6fe] px-4 py-2.5 text-[11px] font-semibold text-[#666d80] hover:bg-[#e0e7ff]"
            >
              <Share2 size={13} /> Share opportunity
            </button>
          </Surface>
          <Surface className="p-5">
            <h2 className="flex items-center gap-2 text-[12px] font-bold text-[#0f172a] dark:text-white">
              <BadgeCheck size={16} className="text-[#6366f1]" /> Source
              information
            </h2>
            <p className="mt-2 text-[10px] leading-5 text-[#8990a2]">
              Check current requirements and application instructions with the
              awarding organization before applying.
            </p>
            <a
              href={
                scholarship.officialSourceUrl ??
                "https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx"
              }
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-[#6366f1] hover:underline"
            >
              {scholarship.officialSourceUrl
                ? "Visit official source"
                : "Explore official resources"}{" "}
              <ArrowUpRight size={12} />
            </a>
          </Surface>
          <Link
            href="/eligibility"
            className="flex items-center gap-3 rounded-2xl border border-[#e0e7ff] bg-[#e0e7ff] p-4 transition hover:bg-[#e0e7ff]"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-white text-[#6366f1]">
              <Sparkles size={16} />
            </span>
            <span className="flex-1">
              <span className="block text-[11px] font-bold text-[#393d5b]">
                Check your eligibility
              </span>
              <span className="mt-1 block text-[9px] text-[#8888a1]">
                Get a personalized result
              </span>
            </span>
            <ArrowUpRight size={15} className="text-[#6366f1]" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
