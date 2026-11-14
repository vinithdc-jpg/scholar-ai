import type { Scholarship } from "@/lib/sample-data";

export type ScholarshipRecord = {
  id: number | string;
  name: string;
  provider: string;
  description: string;
  scholarship_type: string | null;
  education_levels: string[] | null;
  eligible_courses: string[] | null;
  eligible_states: string[] | null;
  benefits: unknown;
  amount: number | string | null;
  application_deadline: string | Date | null;
  official_application_url: string | null;
  official_source_url: string | null;
  is_community_submitted: boolean;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function dateValue(value: string | Date | null): Date | null {
  if (!value) return null;
  const dateText =
    value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  const date = new Date(`${dateText}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toScholarshipDisplay(record: ScholarshipRecord): Scholarship {
  const deadlineDate = dateValue(record.application_deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - today.getTime()) / 86_400_000)
    : Number.MAX_SAFE_INTEGER;
  const providerInitials =
    record.provider
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "SC";
  const amount =
    record.amount === null
      ? "Not specified"
      : `$${Number(record.amount).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })}`;
  const deadline = deadlineDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(deadlineDate)
    : "No deadline";
  const educationLevels = record.education_levels ?? [];
  const eligibleCourses = record.eligible_courses ?? [];
  const eligibleStates = record.eligible_states ?? [];

  return {
    id: String(record.id),
    name: record.name,
    provider: record.provider,
    amount,
    deadline,
    daysLeft,
    category:
      record.scholarship_type || educationLevels[0] || "Scholarship",
    description: record.description,
    color: "from-[#6366f1] to-[#312e81]",
    initials: providerInitials,
    eligibility: [...educationLevels, ...eligibleCourses, ...eligibleStates],
    benefits: stringArray(record.benefits),
    documents: [],
    officialApplicationUrl: record.official_application_url ?? undefined,
    officialSourceUrl: record.official_source_url ?? undefined,
    location: eligibleStates.join(", ") || "Not specified",
    isCommunitySubmitted: record.is_community_submitted,
  };
}
