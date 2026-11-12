import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { integrationUnavailable } from "@/lib/api/http";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
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

  return integrationUnavailable(
    "Document ingestion queue (Redis/BullMQ worker)",
  );
}
