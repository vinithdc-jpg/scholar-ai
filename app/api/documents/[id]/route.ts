import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse, requireRoles } from "@/lib/api/auth";
import { deleteCloudinaryRaw } from "@/lib/api/cloudinary";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await context.params).id);
  if (!id.success)
    return NextResponse.json(
      { error: "Invalid document ID." },
      { status: 400 },
    );
  const isAdmin = auth.user.role !== "student";

  try {
    const result = await getDatabasePool().query(
      `SELECT id, scholarship_id, title, document_type,
              cloudinary_secure_url, original_filename, mime_type, file_size,
              page_count, source_url, academic_year, version,
              verification_status, processing_status, uploaded_by, created_at
       FROM scholarship_documents WHERE id = $1
       ${isAdmin ? "" : "AND uploaded_by = $2"}`,
      isAdmin ? [id.data] : [id.data, auth.user.id],
    );
    if (!result.rowCount)
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    return NextResponse.json({ document: result.rows[0] });
  } catch (error) {
    return databaseError("Unable to load document.", error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireRoles(request, ["content_admin"]);
  if (isResponse(auth)) return auth.response;
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await context.params).id);
  if (!id.success)
    return NextResponse.json(
      { error: "Invalid document ID." },
      { status: 400 },
    );
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT cloudinary_public_id FROM scholarship_documents WHERE id = $1
       FOR UPDATE`,
      [id.data],
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    }

    await deleteCloudinaryRaw(result.rows[0].cloudinary_public_id);
    await client.query("DELETE FROM scholarship_documents WHERE id = $1", [
      id.data,
    ]);
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Unable to delete document.", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Document deletion failed.",
      },
      { status: 503 },
    );
  } finally {
    client.release();
  }
}
