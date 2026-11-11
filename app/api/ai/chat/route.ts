import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { getServerEnv } from "@/lib/env";

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
  if (!env.GROQ_API_KEY || !env.EMBEDDING_PROVIDER || !env.EMBEDDING_MODEL) {
    return NextResponse.json(
      { error: "The RAG chat service is not configured. Configure the LLM and embedding provider first." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: "The grounded retrieval and citation pipeline is not implemented yet." },
    { status: 503 },
  );
}
