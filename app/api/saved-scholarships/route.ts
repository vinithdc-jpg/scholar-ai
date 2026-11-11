import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, getPagination, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

const schema = z.object({ scholarship_id: z.number().int().positive() });

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const result = await getDatabasePool().query(
      `SELECT ss.id AS saved_id, ss.created_at AS saved_at, s.*
       FROM saved_scholarships ss
       JOIN scholarships s ON s.id = ss.scholarship_id
       WHERE ss.user_id = $1
       ORDER BY ss.created_at DESC LIMIT $2 OFFSET $3`,
      [auth.user.id, limit, offset],
    );
    return NextResponse.json({ scholarships: result.rows, pagination: { page, limit } });
  } catch (error) {
    return databaseError("Unable to load saved scholarships.", error);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const parsed = await readJson(request, schema);
  if (parsed.response) return parsed.response;

  try {
    const result = await getDatabasePool().query(
      `INSERT INTO saved_scholarships (user_id, scholarship_id)
       SELECT $1, id FROM scholarships
       WHERE id = $2 AND status = 'published' AND verification_status = 'verified'
       ON CONFLICT (user_id, scholarship_id) DO NOTHING
       RETURNING id, user_id, scholarship_id, created_at`,
      [auth.user.id, parsed.data.scholarship_id],
    );
    if (!result.rowCount) {
      const exists = await getDatabasePool().query(
        "SELECT id, user_id, scholarship_id, created_at FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2",
        [auth.user.id, parsed.data.scholarship_id],
      );
      if (!exists.rowCount) {
        return NextResponse.json({ error: "Published scholarship not found." }, { status: 404 });
      }
      return NextResponse.json({ savedScholarship: exists.rows[0] });
    }
    return NextResponse.json({ savedScholarship: result.rows[0] }, { status: 201 });
  } catch (error) {
    return databaseError("Unable to save scholarship.", error);
  }
}
