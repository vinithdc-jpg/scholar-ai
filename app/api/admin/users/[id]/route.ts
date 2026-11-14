import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();
const schema = z.object({ role: z.literal("student") });

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireRoles(request, ["content_admin"]);
  if (isResponse(auth)) return auth.response;

  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  if (String(id.data) === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot revoke your own admin access." },
      { status: 409 },
    );
  }

  const parsed = await readJson(request, schema);
  if (parsed.response) return parsed.response;

  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('scholar-ai-admin-account-change')::bigint)",
    );

    const adminCount = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM users WHERE role = 'content_admin'",
    );
    if (Number(adminCount.rows[0].count) <= 1) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "The last admin account cannot be revoked." },
        { status: 409 },
      );
    }

    const result = await client.query(
      `UPDATE users SET role = 'student', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'content_admin'
       RETURNING id, email, full_name, role`,
      [id.data],
    );

    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 },
      );
    }

    await client.query(
      `INSERT INTO admin_audit_logs
         (admin_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'admin_access_revoked', 'user', $2, $3)`,
      [
        auth.user.id,
        String(id.data),
        JSON.stringify({ email: result.rows[0].email, role: "student" }),
      ],
    );
    await client.query("COMMIT");

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Unable to roll back admin access revocation.", rollbackError);
    }
    return databaseError("Unable to revoke admin access.", error);
  } finally {
    client.release();
  }
}
