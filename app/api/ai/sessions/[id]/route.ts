import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await context.params).id);
  if (!id.success)
    return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });

  try {
    const session = await getDatabasePool().query(
      "SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2",
      [id.data, auth.user.id],
    );
    if (!session.rowCount)
      return NextResponse.json(
        { error: "Chat session not found." },
        { status: 404 },
      );
    const messages = await getDatabasePool().query(
      "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at",
      [id.data],
    );
    return NextResponse.json({
      session: session.rows[0],
      messages: messages.rows,
    });
  } catch (error) {
    return databaseError("Unable to load chat session.", error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await context.params).id);
  if (!id.success)
    return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });

  try {
    const result = await getDatabasePool().query(
      "DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING id",
      [id.data, auth.user.id],
    );
    if (!result.rowCount)
      return NextResponse.json(
        { error: "Chat session not found." },
        { status: 404 },
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseError("Unable to delete chat session.", error);
  }
}
