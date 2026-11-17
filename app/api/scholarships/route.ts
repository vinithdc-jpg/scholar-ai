import { NextResponse } from "next/server";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { getPagination, databaseError } from "@/lib/api/http";
import { scholarshipFields } from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";
import {
  addScholarshipDocumentUrls,
  storageError,
} from "@/lib/supabase-storage";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  const url = new URL(request.url);
  const { page, limit, offset } = getPagination(url);
  const filters = [
    "status = 'published'",
    "(verification_status = 'verified' OR (submitted_by IS NOT NULL AND verification_status = 'pending'))",
  ];
  const values: unknown[] = [];

  const addFilter = (sql: string, value: unknown) => {
    values.push(value);
    filters.push(sql.replaceAll("?", `$${values.length}`));
  };
  const search = url.searchParams.get("q")?.trim();
  if (search) {
    values.push(`%${search}%`);
    filters.push(
      `(name ILIKE $${values.length}
        OR provider ILIKE $${values.length}
        OR description ILIKE $${values.length}
        OR scholarship_type ILIKE $${values.length}
        OR array_to_string(eligible_courses, ' ') ILIKE $${values.length}
        OR array_to_string(education_levels, ' ') ILIKE $${values.length})`,
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
      `SELECT s.id, ${scholarshipFields.map((field) => `s.${field}`).join(", ")},
         s.submitted_by IS NOT NULL AND s.verification_status = 'pending' AS is_community_submitted,
         (SELECT d.storage_bucket FROM scholarship_documents d
          WHERE d.scholarship_id = s.id AND d.storage_path IS NOT NULL
          ORDER BY d.created_at DESC LIMIT 1) AS document_storage_bucket,
         (SELECT d.storage_path FROM scholarship_documents d
          WHERE d.scholarship_id = s.id AND d.storage_path IS NOT NULL
          ORDER BY d.created_at DESC LIMIT 1) AS document_storage_path
       FROM scholarships s WHERE ${where}
       ORDER BY application_deadline ASC NULLS LAST, created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset],
    );
    try {
      const scholarships = await addScholarshipDocumentUrls(rows.rows);
      return NextResponse.json({
        scholarships,
        pagination: { page, limit, total: countResult.rows[0].total },
      });
    } catch (error) {
      return storageError("Unable to create scholarship document links.", error);
    }
  } catch (error) {
    return databaseError("Unable to list scholarships.", error);
  }
}
