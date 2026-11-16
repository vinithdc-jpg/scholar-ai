"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import ScholarshipCard from "@/components/scholarship-card";
import { ProgressBar, SectionHeading, Surface } from "@/components/ui";
import { apiRequest } from "@/lib/api/client";
import {
  toScholarshipDisplay,
  type ScholarshipRecord,
} from "@/lib/scholarship-display";
import type { Scholarship } from "@/lib/sample-data";

type DashboardPayload = {
  savedScholarships: number;
  applications: { status: string; count: number }[];
  upcomingScholarships: {
    id: number;
    name: string;
    provider: string;
    application_deadline: string | null;
    amount: number | string | null;
  }[];
};

type StudentProfile = Record<string, unknown> | null;
type ApplicationPreview = {
  id: number;
  scholarship_name: string;
  provider: string;
  application_deadline: string | null;
  status: string;
};

const profileFields = [
  "date_of_birth",
  "state",
  "district",
  "category",
  "gender",
  "education_level",
  "course",
  "institution",
  "academic_year",
  "family_income",
  "percentage",
] as const;

function formatDeadline(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No deadline"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(date);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load your dashboard.";
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [recommendations, setRecommendations] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<ApplicationPreview[]>([]);
  const [profile, setProfile] = useState<StudentProfile>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendationError, setRecommendationError] = useState("");

  useEffect(() => {
    let active = true;
    const requests = Promise.all([
      apiRequest<{ dashboard: DashboardPayload }>("/api/students/dashboard"),
      apiRequest<{ profile: StudentProfile }>("/api/students/profile"),
      apiRequest<{ applications: ApplicationPreview[] }>(
        "/api/applications?limit=3",
      ),
      apiRequest<{ scholarships: (ScholarshipRecord & { match_score?: number })[] }>(
        "/api/scholarships/recommended",
      ).catch((cause: unknown) => {
        if (active) setRecommendationError(errorText(cause));
        return null;
      }),
    ]);

    void requests
      .then(([dashboardResult, profileResult, applicationResult, recommendationResult]) => {
        if (!active) return;
        setDashboard(dashboardResult.dashboard);
        setProfile(profileResult.profile);
        setApplications(applicationResult.applications);
        setRecommendations(
          (recommendationResult?.scholarships ?? []).map((row) => ({
            ...toScholarshipDisplay({
              ...row,
              is_community_submitted: false,
            }),
            match:
              typeof row.match_score === "number"
                ? Math.round((row.match_score / 6) * 100)
                : undefined,
          })),
        );
      })
      .catch((cause: unknown) => {
        if (active) setError(errorText(cause));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const profileStrength = useMemo(() => {
    if (!profile) return 0;
    const completed = profileFields.filter((field) => {
      const value = profile[field];
      return value !== null && value !== undefined && String(value).trim() !== "";
    }).length;
    return Math.round((completed / profileFields.length) * 100);
  }, [profile]);

  const applicationCount =
    dashboard?.applications.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const potentialFunding = recommendations.reduce((sum, item) => {
    const amount = Number(item.amount.replace(/[^\d.]/g, ""));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const stats = [
    {
      label: "Scholarships matched",
      value: String(recommendations.length),
      change: "Based on your profile",
      icon: Sparkles,
      color: "bg-[#e0e7ff] text-[#6366f1]",
    },
    {
      label: "Potential funding",
      value: `$${potentialFunding.toLocaleString("en-US")}`,
      change: "Across recommendations",
      icon: Award,
      color: "bg-[#fef3c7] text-[#f59e0b]",
    },
    {
      label: "Applications started",
      value: String(applicationCount),
      change: "In your application tracker",
      icon: FileCheck2,
      color: "bg-[#eef2ff] text-[#312e81]",
    },
    {
      label: "Profile strength",
      value: `${profileStrength}%`,
      change: "Complete your details",
      icon: TrendingUp,
      color: "bg-[#e0e7ff] text-[#312e81]",
    },
  ];

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
      {isLoading && (
        <p className="text-sm text-[#858c9e]" role="status">
          Loading your workspace…
        </p>
      )}
      <section className="relative overflow-hidden rounded-[26px] bg-[#312e81] px-5 py-7 text-white shadow-[0_16px_34px_rgba(15,23,42,0.12)] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-155">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-400/15 px-3 py-1.5 text-[11px] font-semibold text-indigo-200">
              <Sparkles size={12} /> Your student workspace
            </div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tighter sm:text-[36px] lg:text-[40px]">
              Your scholarship dashboard
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-slate-300 sm:text-[16px]">
              {dashboard?.savedScholarships ?? 0} saved opportunities and{" "}
              {applicationCount} tracked applications.
            </p>
          </div>
          <Link
            href="/scholarships"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-3 text-[12px] font-bold text-white transition hover:bg-[#4338ca] sm:px-5 sm:text-[13px]"
          >
            Explore scholarships <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <section aria-label="Your scholarship overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, icon: Icon, color }) => (
          <Surface key={label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-medium text-[#8990a2]">{label}</p>
              <span className={`grid size-9 place-items-center rounded-xl ${color}`}>
                <Icon size={17} />
              </span>
            </div>
            <div className="mt-3">
              <p className="text-[27px] font-extrabold leading-none tracking-tighter text-[#0f172a] dark:text-white">
                {value}
              </p>
              <span className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[#312e81]">
                <TrendingUp size={12} /> {change}
              </span>
            </div>
          </Surface>
        ))}
      </section>

      <section>
        <SectionHeading
          title="Picked for you"
          description="Verified opportunities matched to your student profile."
          action={
            <Link href="/scholarships" className="text-[11px] font-bold text-[#6366f1] hover:underline">
              See all scholarships <ArrowRight size={13} className="inline" />
            </Link>
          }
        />
        {recommendationError && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-[12px] text-amber-800" role="status">
            {recommendationError}
          </p>
        )}
        {recommendations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.slice(0, 3).map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        ) : (
          !isLoading && (
            <Surface className="p-6 text-center text-[12px] text-[#858c9e]">
              Complete your{" "}
              <Link href="/profile" className="font-semibold text-[#6366f1]">
                student profile
              </Link>{" "}
              to receive personalized recommendations.
            </Surface>
          )
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div>
          <SectionHeading
            title="Application progress"
            description="Keep an eye on the opportunities you’ve started."
            action={
              <Link href="/applications" className="text-[11px] font-bold text-[#6366f1] hover:underline">
                View tracker <ArrowRight size={13} className="inline" />
              </Link>
            }
          />
          <Surface className="divide-y divide-[#ddd6fe] overflow-hidden">
            {applications.length > 0 ? (
              applications.map((application) => (
                <Link
                  key={application.id}
                  href="/applications"
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-[#f5f3ff]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-bold text-[#0f172a] dark:text-white">
                      {application.scholarship_name}
                    </span>
                    <span className="mt-1 block text-[10px] text-[#979eae]">
                      {application.provider} · {application.status.replaceAll("_", " ")}
                    </span>
                  </span>
                  <span className="text-[10px] text-[#82899a]">
                    {formatDeadline(application.application_deadline)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="px-5 py-6 text-[11px] text-[#858c9e]">
                You haven’t started an application yet.
              </p>
            )}
          </Surface>
        </div>

        <div>
          <SectionHeading title="Coming up" description="Published scholarship deadlines." />
          <Surface className="p-5">
            {dashboard?.upcomingScholarships.length ? (
              <div className="space-y-4">
                {dashboard.upcomingScholarships.map((item) => (
                  <Link
                    key={item.id}
                    href={`/scholarships/${item.id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-[#fef3c7] text-[#f59e0b]">
                      <Clock3 size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-[#565d72]">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-[10px] text-[#949bad]">
                        {formatDeadline(item.application_deadline)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#858c9e]">
                No upcoming deadlines are available.
              </p>
            )}
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
              Your profile is {profileStrength}% complete.
            </p>
            <ProgressBar value={profileStrength} />
          </div>
        </div>
        <Link href="/profile" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6366f1] hover:underline">
          Complete profile <ArrowRight size={14} />
        </Link>
      </Surface>
    </div>
  );
}
