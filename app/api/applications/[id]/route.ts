import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();
const patchSchema = z.object({
  status: z.enum([
    "not_started",
    "in_progress",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "withdrawn",
  ]).optional(),
  student_notes: z.string().max(10000).nullable().optional(),
  applied_at: z.string().datetime().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field.");

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });

  try {
    const result = await getDatabasePool().query(
      `SELECT a.*, s.name AS scholarship_name, s.provider,
              s.application_deadline
       FROM applications a JOIN scholarships s ON s.id = a.scholarship_id
       WHERE a.id = $1 AND a.user_id = $2`,
      [id.data, auth.user.id],
    );
    if (!result.rowCount) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    const history = await getDatabasePool().query(
      "SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY created_at",
      [id.data],
    );
    return NextResponse.json({ application: result.rows[0], history: history.rows });
  } catch (error) {
    return databaseError("Unable to load application.", error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
  const parsed = await readJson(request, patchSchema);
  if (parsed.response) return parsed.response;

  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const old = await client.query(
      "SELECT * FROM applications WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [id.data, auth.user.id],
    );
    if (!old.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const nextStatus = parsed.data.status ?? old.rows[0].status;
    const nextNotes = Object.hasOwn(parsed.data, "student_notes")
      ? parsed.data.student_notes ?? null
      : old.rows[0].student_notes;
    const nextAppliedAt = Object.hasOwn(parsed.data, "applied_at")
      ? parsed.data.applied_at ?? null
      : old.rows[0].applied_at;
    const result = await client.query(
      `UPDATE applications SET
         status = $1,
         student_notes = $2,
         applied_at = $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [
        nextStatus,
        nextNotes,
        nextAppliedAt,
        id.data,
        auth.user.id,
      ],
    );
    if (nextStatus !== old.rows[0].status) {
      await client.query(
        `INSERT INTO application_status_history
           (application_id, previous_status, new_status)
         VALUES ($1, $2, $3)`,
        [id.data, old.rows[0].status, nextStatus],
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ application: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return databaseError("Unable to update application.", error);
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });

  try {
    const result = await getDatabasePool().query(
      "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id",
      [id.data, auth.user.id],
    );
    if (!result.rowCount) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseError("Unable to delete application.", error);
  }
}
