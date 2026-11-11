import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { id: rawId } = await context.params;
  const id = z.coerce.number().int().positive().safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid saved scholarship ID." }, { status: 400 });
  }

  try {
    const result = await getDatabasePool().query(
      "DELETE FROM saved_scholarships WHERE id = $1 AND user_id = $2 RETURNING id",
      [id.data, auth.user.id],
    );
    if (!result.rowCount) {
      return NextResponse.json({ error: "Saved scholarship not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseError("Unable to remove saved scholarship.", error);
  }
}
