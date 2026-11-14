import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import {
  normalizeScholarshipInput,
  scholarshipFields,
  scholarshipSchema,
} from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";

const httpsUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    (value) => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Use an HTTPS URL." },
  );

const createSchema = scholarshipSchema
  .omit({ status: true, verification_status: true })
  .extend({
    description: z.string().trim().max(5000).default(""),
    education_levels: z
      .array(z.string().trim().min(1).max(120))
      .max(25)
      .optional(),
    eligible_courses: z
      .array(z.string().trim().min(1).max(255))
      .max(25)
      .optional(),
    eligible_states: z
      .array(z.string().trim().min(1).max(120))
      .max(25)
      .optional(),
    benefits: z
      .array(z.string().trim().min(1).max(500))
      .max(25)
      .optional(),
    official_application_url: httpsUrl.nullable().optional(),
    official_source_url: httpsUrl,
  });

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  const parsed = await readJson(request, createSchema);
  if (parsed.response) return parsed.response;

  const values = normalizeScholarshipInput({
    ...parsed.data,
    status: "published",
    verification_status: "pending",
  });

  try {
    const result = await getDatabasePool().query(
      `INSERT INTO scholarships (${scholarshipFields.join(", ")}, submitted_by)
       VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")}, $${values.length + 1})
       RETURNING id, name, provider, status, verification_status`,
      [...values, auth.user.id],
    );

    return NextResponse.json({ scholarship: result.rows[0] }, { status: 201 });
  } catch (error) {
    return databaseError("Unable to publish the scholarship submission.", error);
  }
}