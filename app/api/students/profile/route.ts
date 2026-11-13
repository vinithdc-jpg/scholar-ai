import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

const profileSchema = z.object({
  date_of_birth: z.string().date().nullable().optional(),
  state: z.string().max(120).nullable().optional(),
  district: z.string().max(120).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  gender: z.string().max(80).nullable().optional(),
  education_level: z.string().max(120).nullable().optional(),
  course: z.string().max(255).nullable().optional(),
  institution: z.string().max(255).nullable().optional(),
  academic_year: z.string().max(32).nullable().optional(),
  family_income: z.number().nonnegative().nullable().optional(),
  percentage: z.number().min(0).max(100).nullable().optional(),
});

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  try {
    const result = await getDatabasePool().query(
      `SELECT id, user_id, date_of_birth::text AS date_of_birth,
              state, district, category, gender, education_level, course,
              institution, academic_year, family_income, percentage,
              created_at, updated_at
       FROM student_profiles
       WHERE user_id = $1`,
      [auth.user.id],
    );
    return NextResponse.json({ profile: result.rows[0] ?? null });
  } catch (error) {
    return databaseError("Unable to load student profile.", error);
  }
}

export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const parsed = await readJson(request, profileSchema);
  if (parsed.response) return parsed.response;

  const data = parsed.data;
  const fields = [
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
  const values = fields.map((field) => data[field] ?? null);

  try {
    const result = await getDatabasePool().query(
      `INSERT INTO student_profiles (
         user_id, ${fields.join(", ")}
       ) VALUES ($1, ${fields.map((_, index) => `$${index + 2}`).join(", ")})
       ON CONFLICT (user_id) DO UPDATE SET
         ${fields.map((field) => `${field} = EXCLUDED.${field}`).join(", ")},
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, date_of_birth::text AS date_of_birth,
                 state, district, category, gender, education_level, course,
                 institution, academic_year, family_income, percentage,
                 created_at, updated_at`,
      [auth.user.id, ...values],
    );
    return NextResponse.json({ profile: result.rows[0] });
  } catch (error) {
    return databaseError("Unable to save student profile.", error);
  }
}
