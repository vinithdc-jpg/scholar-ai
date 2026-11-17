import { NextResponse } from "next/server";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";
import {
  addScholarshipDocumentUrls,
  storageError,
} from "@/lib/supabase-storage";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  try {
    const pool = getDatabasePool();
    const profile = await pool.query(
      "SELECT state, course, education_level, family_income FROM student_profiles WHERE user_id = $1",
      [auth.user.id],
    );
    const student = profile.rows[0];
    if (!student) {
      return NextResponse.json(
        { error: "Complete your student profile to get recommendations." },
        { status: 409 },
      );
    }

    const result = await pool.query(
      `SELECT s.*,
         d.storage_bucket AS document_storage_bucket,
         d.storage_path AS document_storage_path,
         (
           CASE WHEN cardinality(s.eligible_states) = 0 OR $1 = ANY(s.eligible_states) THEN 2 ELSE 0 END +
           CASE WHEN cardinality(s.eligible_courses) = 0 OR $2 = ANY(s.eligible_courses) THEN 2 ELSE 0 END +
           CASE WHEN cardinality(s.education_levels) = 0 OR $3 = ANY(s.education_levels) THEN 1 ELSE 0 END +
           CASE WHEN s.income_limit IS NULL OR $4 <= s.income_limit THEN 1 ELSE 0 END
         ) AS match_score
       FROM scholarships s
       LEFT JOIN LATERAL (
         SELECT storage_bucket, storage_path FROM scholarship_documents
         WHERE scholarship_id = s.id AND storage_path IS NOT NULL
         ORDER BY created_at DESC LIMIT 1
       ) d ON TRUE
       WHERE s.status = 'published'
         AND s.verification_status = 'verified'
         AND (s.application_deadline IS NULL OR s.application_deadline >= CURRENT_DATE)
       ORDER BY match_score DESC, s.application_deadline ASC NULLS LAST
       LIMIT 20`,
      [
        student.state,
        student.course,
        student.education_level,
        student.family_income,
      ],
    );
    try {
      const scholarships = await addScholarshipDocumentUrls(result.rows);
      return NextResponse.json({ scholarships });
    } catch (error) {
      return storageError("Unable to create scholarship document links.", error);
    }
  } catch (error) {
    return databaseError("Unable to load scholarship recommendations.", error);
  }
}
