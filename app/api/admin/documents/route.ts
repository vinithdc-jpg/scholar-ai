import { NextResponse } from "next/server";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError, getPagination } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const result = await getDatabasePool().query(
      `SELECT d.*, u.full_name AS uploader_name
       FROM scholarship_documents d LEFT JOIN users u ON u.id = d.uploaded_by
       ORDER BY d.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return NextResponse.json({ documents: result.rows, pagination: { page, limit } });
  } catch (error) {
    return databaseError("Unable to list admin documents.", error);
  }
}
