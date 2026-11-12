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
      `SELECT j.*, d.title AS document_title
       FROM ingestion_jobs j JOIN scholarship_documents d ON d.id = j.document_id
       ORDER BY j.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return NextResponse.json({
      jobs: result.rows,
      pagination: { page, limit },
    });
  } catch (error) {
    return databaseError("Unable to list ingestion jobs.", error);
  }
}
