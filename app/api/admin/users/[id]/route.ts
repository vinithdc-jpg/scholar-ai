import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();
const schema = z.object({ role: z.literal("student") });

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireRoles(request, ["super_admin"]);
  if (isResponse(auth)) return auth.response;

  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  const parsed = await readJson(request, schema);
  if (parsed.response) return parsed.response;

  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE users SET role = 'student', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND role = 'content_admin'
       RETURNING id, email, full_name, role`,
      [id.data],
    );

    if (!result.rowCount) {
      const current = await client.query(
        "SELECT role FROM users WHERE id = $1",
        [id.data],
      );
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          error:
            current.rows[0]?.role === "super_admin"
              ? "Super-admin accounts cannot be changed here."
              : "Admin account not found.",
        },
        { status: current.rows[0]?.role === "super_admin" ? 409 : 404 },
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
    await client.query("ROLLBACK");
    return databaseError("Unable to revoke admin access.", error);
  } finally {
    client.release();
  }
}
