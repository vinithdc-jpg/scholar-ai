import { NextResponse } from "next/server";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
  if (isResponse(auth)) return auth.response;

  try {
    const pool = getDatabasePool();
    const [users, scholarships, documents, jobs] = await Promise.all([
      pool.query("SELECT role, COUNT(*)::int AS count FROM users GROUP BY role"),
      pool.query("SELECT status, COUNT(*)::int AS count FROM scholarships GROUP BY status"),
      pool.query(
        "SELECT processing_status AS status, COUNT(*)::int AS count FROM scholarship_documents GROUP BY processing_status",
      ),
      pool.query("SELECT status, COUNT(*)::int AS count FROM ingestion_jobs GROUP BY status"),
    ]);
    return NextResponse.json({
      dashboard: {
        users: users.rows,
        scholarships: scholarships.rows,
        documents: documents.rows,
        ingestionJobs: jobs.rows,
      },
    });
  } catch (error) {
    return databaseError("Unable to load admin dashboard.", error);
  }
}
