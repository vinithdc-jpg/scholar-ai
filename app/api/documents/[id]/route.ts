import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
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

  try {
    const result = await getDatabasePool().query(
      `SELECT id, scholarship_id, title, document_type,
              cloudinary_secure_url, original_filename, mime_type, file_size,
              page_count, source_url, academic_year, version,
              verification_status, processing_status, uploaded_by, created_at
       FROM scholarship_documents WHERE id = $1 AND uploaded_by = $2`,
      [id.data, auth.user.id],
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
