import { NextResponse } from "next/server";
import { z } from "zod";
import {
  authenticateRequest,
  isResponse,
  requireRoles,
} from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import {
  scholarshipFields,
  scholarshipSchema,
} from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { id: rawId } = await context.params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid scholarship ID." }, { status: 400 });
  }

  try {
    const result = await getDatabasePool().query(
      `SELECT * FROM scholarships WHERE id = $1
       AND (status = 'published' AND verification_status = 'verified' OR $2)`,
      [
        id.data,
        auth.user.role === "content_admin" || auth.user.role === "super_admin",
      ],
    );
    if (!result.rowCount) {
      return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
    }
    return NextResponse.json({ scholarship: result.rows[0] });
  } catch (error) {
    return databaseError("Unable to load scholarship.", error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
  if (isResponse(auth)) return auth.response;
  const { id: rawId } = await context.params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid scholarship ID." }, { status: 400 });
  }
  const parsed = await readJson(request, scholarshipSchema.partial());
  if (parsed.response) return parsed.response;
  if (!Object.keys(parsed.data).length) {
    return NextResponse.json({ error: "Provide at least one field to update." }, { status: 400 });
  }

  try {
    const fields = scholarshipFields.filter((field) =>
      Object.hasOwn(parsed.data, field),
    );
    const values = fields.map((field) => parsed.data[field]);
    const result = await getDatabasePool().query(
      `UPDATE scholarships SET
         ${fields.map((field, index) => `${field} = $${index + 1}`).join(", ")},
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id.data],
    );
    if (!result.rowCount) {
      return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
    }
    return NextResponse.json({ scholarship: result.rows[0] });
  } catch (error) {
    return databaseError("Unable to update scholarship.", error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
  if (isResponse(auth)) return auth.response;
  const { id: rawId } = await context.params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid scholarship ID." }, { status: 400 });
  }

  try {
    const result = await getDatabasePool().query(
      `UPDATE scholarships SET status = 'archived', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING id, status`,
      [id.data],
    );
    if (!result.rowCount) {
      return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
    }
    return NextResponse.json({ scholarship: result.rows[0] });
  } catch (error) {
    return databaseError("Unable to archive scholarship.", error);
  }
}
