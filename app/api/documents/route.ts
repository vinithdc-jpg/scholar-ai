import { NextResponse } from "next/server";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, getPagination } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));
  const isAdmin = auth.user.role !== "student";

  try {
    const result = await getDatabasePool().query(
      `SELECT id, scholarship_id, title, document_type,
              cloudinary_secure_url, original_filename, mime_type, file_size,
              page_count, source_url, academic_year, version,
              verification_status, processing_status, uploaded_by, created_at
       FROM scholarship_documents
       ${isAdmin ? "" : "WHERE uploaded_by = $1"}
       ORDER BY created_at DESC
       LIMIT $${isAdmin ? 1 : 2} OFFSET $${isAdmin ? 2 : 3}`,
      isAdmin ? [limit, offset] : [auth.user.id, limit, offset],
    );
    return NextResponse.json({
      documents: result.rows,
      pagination: { page, limit },
    });
  } catch (error) {
    return databaseError("Unable to list documents.", error);
  }
}
