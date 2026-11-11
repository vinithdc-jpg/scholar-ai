import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };
const bodySchema = z.object({
  verification_status: z.enum(["verified", "rejected"]),
});

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
  if (isResponse(auth)) return auth.response;
  const id = z.coerce.number().int().positive().safeParse((await context.params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid document ID." }, { status: 400 });
  const parsed = await readJson(request, bodySchema);
  if (parsed.response) return parsed.response;

  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE scholarship_documents SET verification_status = $1,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING id, scholarship_id, title, verification_status`,
      [parsed.data.verification_status, id.data],
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    await client.query(
      `INSERT INTO admin_audit_logs
         (admin_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'scholarship_document', $3, $4)`,
      [
        auth.user.id,
        `document_${parsed.data.verification_status}`,
        String(id.data),
        JSON.stringify({ verification_status: parsed.data.verification_status }),
      ],
    );
    await client.query("COMMIT");
    return NextResponse.json({ document: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return databaseError("Unable to update document verification.", error);
  } finally {
    client.release();
  }
}
