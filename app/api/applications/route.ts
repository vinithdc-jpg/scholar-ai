import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, getPagination, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

const createSchema = z.object({
  scholarship_id: z.number().int().positive(),
  student_notes: z.string().max(10000).optional(),
});

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const result = await getDatabasePool().query(
      `SELECT a.*, s.name AS scholarship_name, s.provider,
              s.application_deadline
       FROM applications a JOIN scholarships s ON s.id = a.scholarship_id
       WHERE a.user_id = $1 ORDER BY a.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [auth.user.id, limit, offset],
    );
    return NextResponse.json({
      applications: result.rows,
      pagination: { page, limit },
    });
  } catch (error) {
    return databaseError("Unable to load applications.", error);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const parsed = await readJson(request, createSchema);
  if (parsed.response) return parsed.response;

  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO applications (user_id, scholarship_id, student_notes)
       SELECT $1, id, $3 FROM scholarships
       WHERE id = $2 AND status = 'published'
         AND (verification_status = 'verified'
           OR (submitted_by IS NOT NULL AND verification_status = 'pending'))
       ON CONFLICT (user_id, scholarship_id) DO NOTHING
       RETURNING *`,
      [
        auth.user.id,
        parsed.data.scholarship_id,
        parsed.data.student_notes ?? null,
      ],
    );
    if (!inserted.rowCount) {
      const existing = await client.query(
        "SELECT id FROM applications WHERE user_id = $1 AND scholarship_id = $2",
        [auth.user.id, parsed.data.scholarship_id],
      );
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: existing.rowCount
            ? "Application already exists."
            : "Published scholarship not found.",
        },
        { status: existing.rowCount ? 409 : 404 },
      );
    }

    await client.query(
      `INSERT INTO application_status_history (application_id, new_status, notes)
       VALUES ($1, $2, $3)`,
      [inserted.rows[0].id, inserted.rows[0].status, "Application created"],
    );
    await client.query("COMMIT");
    return NextResponse.json(
      { application: inserted.rows[0] },
      { status: 201 },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    return databaseError("Unable to create application.", error);
  } finally {
    client.release();
  }
}
