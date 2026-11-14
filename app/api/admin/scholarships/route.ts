import { NextResponse } from "next/server";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError, getPagination } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await requireRoles(request, ["content_admin"]);
  if (isResponse(auth)) return auth.response;

  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const pool = getDatabasePool();
    const [count, result] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM scholarships"),
      pool.query(
        `SELECT * FROM scholarships
         ORDER BY updated_at DESC, created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
    ]);

    return NextResponse.json({
      scholarships: result.rows,
      pagination: { page, limit, total: count.rows[0].total },
    });
  } catch (error) {
    return databaseError("Unable to load admin scholarships.", error);
  }
}
