import { NextResponse } from "next/server";
import { z } from "zod";

export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<
  | { data: z.output<T>; response?: never }
  | { data?: never; response: NextResponse }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      response: NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        {
          error: "Request validation failed.",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}

export function getPagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20),
  );
  return { page, limit, offset: (page - 1) * limit };
}

export function databaseError(message: string, error: unknown) {
  console.error(message, error);
  return NextResponse.json(
    {
      error:
        "A database operation failed. Check database configuration and migrations.",
    },
    { status: 503 },
  );
}

export function integrationUnavailable(name: string) {
  return NextResponse.json(
    { error: `${name} is not configured for this application yet.` },
    { status: 503 },
  );
}
