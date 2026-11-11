import { NextResponse } from "next/server";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  try {
    const pool = getDatabasePool();
    const [saved, applications, recommendations] = await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int AS count FROM saved_scholarships WHERE user_id = $1",
        [auth.user.id],
      ),
      pool.query(
        "SELECT status, COUNT(*)::int AS count FROM applications WHERE user_id = $1 GROUP BY status",
        [auth.user.id],
      ),
      pool.query(
        `SELECT id, name, provider, application_deadline, amount
         FROM scholarships
         WHERE status = 'published' AND verification_status = 'verified'
           AND (application_deadline IS NULL OR application_deadline >= CURRENT_DATE)
         ORDER BY application_deadline ASC NULLS LAST
         LIMIT 5`,
      ),
    ]);

    return NextResponse.json({
      dashboard: {
        savedScholarships: saved.rows[0].count,
        applications: applications.rows,
        upcomingScholarships: recommendations.rows,
      },
    });
  } catch (error) {
    return databaseError("Unable to load student dashboard.", error);
  }
}
