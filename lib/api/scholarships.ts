import { z } from "zod";

export const scholarshipSchema = z.object({
  name: z.string().trim().min(1).max(255),
  provider: z.string().trim().min(1).max(255),
  description: z.string().default(""),
  scholarship_type: z.string().max(120).nullable().optional(),
  education_levels: z.array(z.string().max(120)).optional(),
  eligible_courses: z.array(z.string().max(255)).optional(),
  eligible_states: z.array(z.string().max(120)).optional(),
  benefits: z.array(z.string()).optional(),
  amount: z.number().nonnegative().nullable().optional(),
  income_limit: z.number().nonnegative().nullable().optional(),
  application_start_date: z.string().date().nullable().optional(),
  application_deadline: z.string().date().nullable().optional(),
  official_application_url: z.string().url().nullable().optional(),
  official_source_url: z.string().url().nullable().optional(),
  academic_year: z.string().max(32).nullable().optional(),
  verification_status: z.enum(["pending", "verified", "rejected"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const scholarshipFields = [
  "name",
  "provider",
  "description",
  "scholarship_type",
  "education_levels",
  "eligible_courses",
  "eligible_states",
  "benefits",
  "amount",
  "income_limit",
  "application_start_date",
  "application_deadline",
  "official_application_url",
  "official_source_url",
  "academic_year",
  "verification_status",
  "status",
] as const;

export function normalizeScholarshipInput(
  input: z.output<typeof scholarshipSchema>,
) {
  return [
    input.name,
    input.provider,
    input.description,
    input.scholarship_type ?? null,
    input.education_levels ?? [],
    input.eligible_courses ?? [],
    input.eligible_states ?? [],
    input.benefits ?? [],
    input.amount ?? null,
    input.income_limit ?? null,
    input.application_start_date ?? null,
    input.application_deadline ?? null,
    input.official_application_url ?? null,
    input.official_source_url ?? null,
    input.academic_year ?? null,
    input.verification_status ?? "pending",
    input.status ?? "draft",
  ];
}
