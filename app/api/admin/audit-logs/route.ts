import { NextResponse } from "next/server";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError, getPagination } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await requireRoles(request, ["super_admin"]);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const result = await getDatabasePool().query(
      `SELECT l.*, u.full_name AS admin_name
       FROM admin_audit_logs l LEFT JOIN users u ON u.id = l.admin_user_id
       ORDER BY l.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return NextResponse.json({ auditLogs: result.rows, pagination: { page, limit } });
  } catch (error) {
    return databaseError("Unable to load audit logs.", error);
  }
}
