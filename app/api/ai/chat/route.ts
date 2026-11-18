import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import {
  answerGroundedChat,
  createDefaultRagDependencies,
  RagConfigurationError,
  RagSessionNotFoundError,
} from "@/lib/rag-chat.service";

const schema = z.object({
  message: z.string().trim().min(1).max(10000),
  session_id: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  const parsed = await (async () => {
    try {
      const body: unknown = await request.json();
      return schema.safeParse(body);
    } catch {
      return schema.safeParse(null);
    }
  })();
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide a valid message and optional session_id." },
      { status: 400 },
    );
  }

  const env = getServerEnv();
  if (
    !env.GROQ_API_KEY ||
    !env.EMBEDDING_API_KEY ||
    !env.EMBEDDING_PROVIDER ||
    !env.EMBEDDING_MODEL
  ) {
    return NextResponse.json(
      {
        error:
          "The RAG chat service is not configured. Configure the LLM and embedding provider first.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await answerGroundedChat(
      getDatabasePool(),
      {
        userId: auth.user.id,
        message: parsed.data.message,
        sessionId: parsed.data.session_id,
      },
      createDefaultRagDependencies(),
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RagSessionNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof RagConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (
      error instanceof Error &&
      (error.message.startsWith("Embedding provider") ||
        error.message.startsWith("Groq request failed") ||
        error.message.startsWith("Unsupported embedding provider") ||
        error.message.includes("embedding dimensions"))
    ) {
      console.error("Grounded chat provider error.", error);
      return NextResponse.json(
        {
          error:
            "The grounded retrieval service could not complete this request. Check the embedding and Groq configuration.",
        },
        { status: 503 },
      );
    }
    return databaseError("Unable to complete the grounded chat request.", error);
  }
}
