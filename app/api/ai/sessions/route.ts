import { NextResponse } from "next/server";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, getPagination } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const result = await getDatabasePool().query(
      `SELECT * FROM chat_sessions WHERE user_id = $1
       ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
      [auth.user.id, limit, offset],
    );
    return NextResponse.json({ sessions: result.rows, pagination: { page, limit } });
  } catch (error) {
    return databaseError("Unable to list chat sessions.", error);
  }
}
