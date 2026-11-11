import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse, requireRoles } from "@/lib/api/auth";
import { getPagination, databaseError, readJson } from "@/lib/api/http";
import {
  normalizeScholarshipInput,
  scholarshipFields,
  scholarshipSchema,
} from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";

const createSchema = scholarshipSchema.extend({
  name: z.string().trim().min(1).max(255),
  provider: z.string().trim().min(1).max(255),
});

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  const url = new URL(request.url);
  const { page, limit, offset } = getPagination(url);
  const filters = ["status = 'published'", "verification_status = 'verified'"];
  const values: unknown[] = [];

  const addFilter = (sql: string, value: unknown) => {
    values.push(value);
    filters.push(sql.replaceAll("?", `$${values.length}`));
  };
  const search = url.searchParams.get("q")?.trim();
  if (search) {
    values.push(`%${search}%`);
    filters.push(
      `(name ILIKE $${values.length} OR provider ILIKE $${values.length})`,
    );
  }
  const state = url.searchParams.get("state");
  if (state) addFilter("? = ANY(eligible_states)", state);
  const course = url.searchParams.get("course");
  if (course) addFilter("? = ANY(eligible_courses)", course);
  const level = url.searchParams.get("education_level");
  if (level) addFilter("? = ANY(education_levels)", level);
  const type = url.searchParams.get("scholarship_type");
  if (type) addFilter("scholarship_type = ?", type);

  const where = filters.join(" AND ");
  try {
    const pool = getDatabasePool();
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM scholarships WHERE ${where}`,
      values,
    );
    const rows = await pool.query(
      `SELECT * FROM scholarships WHERE ${where}
       ORDER BY application_deadline ASC NULLS LAST, created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    return NextResponse.json({
      scholarships: rows.rows,
      pagination: { page, limit, total: countResult.rows[0].total },
    });
  } catch (error) {
    return databaseError("Unable to list scholarships.", error);
  }
}

export async function POST(request: Request) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
  if (isResponse(auth)) return auth.response;
  const parsed = await readJson(request, createSchema);
  if (parsed.response) return parsed.response;

  const values = normalizeScholarshipInput(parsed.data);
  try {
    const result = await getDatabasePool().query(
      `INSERT INTO scholarships (${scholarshipFields.join(", ")})
       VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")})
       RETURNING *`,
      values,
    );
    return NextResponse.json({ scholarship: result.rows[0] }, { status: 201 });
  } catch (error) {
    return databaseError("Unable to create scholarship.", error);
  }
}
