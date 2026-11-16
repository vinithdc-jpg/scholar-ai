import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { scholarshipFields } from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { id: rawId } = await context.params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json(
      { error: "Invalid scholarship ID." },
      { status: 400 },
    );
  }

  try {
    const result = await getDatabasePool().query(
      `SELECT id, ${scholarshipFields.join(", ")},
         submitted_by IS NOT NULL AND verification_status = 'pending' AS is_community_submitted
       FROM scholarships WHERE id = $1
       AND status = 'published'
       AND (verification_status = 'verified'
         OR (submitted_by IS NOT NULL AND verification_status = 'pending'))`,
      [id.data],
    );
    if (!result.rowCount) {
      return NextResponse.json(
        { error: "Scholarship not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ scholarship: result.rows[0] });
  } catch (error) {
    return databaseError("Unable to load scholarship.", error);
  }
}
