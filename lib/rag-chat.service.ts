import type { Pool, PoolClient } from "pg";
import {
  buildGroundedContext,
  buildGroundedUserPrompt,
  INSUFFICIENT_EVIDENCE_MESSAGE,
} from "@/lib/context-builder";
import { createQueryEmbedding } from "@/lib/embedding.service";
import { getServerEnv } from "@/lib/env";
import { generateGroundedAnswer } from "@/lib/groq.service";
import {
  retrieveVerifiedScholarshipChunks,
  toCitations,
  type RetrievedChunk,
} from "@/lib/retrieval.service";

export type ChatCitation = {
  source_title: string;
  scholarship_id: number;
  section: string | null;
  page_number: number | null;
};

export type GroundedChatResult = {
  session_id: number;
  answer: string;
  response: string;
  citations: ChatCitation[];
};

export class RagSessionNotFoundError extends Error {
  constructor() {
    super("Chat session not found.");
    this.name = "RagSessionNotFoundError";
  }
}

export class RagConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RagConfigurationError";
  }
}

export type RagChatDependencies = {
  embedQuery: (question: string) => Promise<number[]>;
  retrieve: (embedding: number[]) => Promise<RetrievedChunk[]>;
  generateAnswer: (prompt: string) => Promise<string>;
};

function conversationTitle(message: string) {
  const title = message.replace(/\s+/g, " ").trim().slice(0, 80);
  return title || "New conversation";
}

async function loadOrCreateSession(
  client: PoolClient,
  userId: string,
  sessionId: number | undefined,
  message: string,
) {
  if (sessionId) {
    const existing = await client.query(
      `SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId],
    );
    if (!existing.rowCount) {
      throw new RagSessionNotFoundError();
    }
    await client.query(`UPDATE chat_sessions SET title = title WHERE id = $1`, [
      sessionId,
    ]);
    return sessionId;
  }

  const created = await client.query<{ id: string | number }>(
    `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id`,
    [userId, conversationTitle(message)],
  );
  return Number(created.rows[0].id);
}

export function createDefaultRagDependencies(): RagChatDependencies {
  const env = getServerEnv();
  const requiresEmbeddingApiKey = env.EMBEDDING_PROVIDER !== "local";
  if (
    !env.GROQ_API_KEY ||
    (requiresEmbeddingApiKey && !env.EMBEDDING_API_KEY) ||
    !env.EMBEDDING_PROVIDER ||
    !env.EMBEDDING_MODEL
  ) {
    throw new RagConfigurationError(
      "The RAG chat service is not configured. Configure the LLM and embedding provider first.",
    );
  }

  const groqApiKey = env.GROQ_API_KEY;
  const groqModel = env.GROQ_MODEL;
  const embeddingApiKey = env.EMBEDDING_API_KEY;
  const embeddingProvider = env.EMBEDDING_PROVIDER;
  const embeddingModel = env.EMBEDDING_MODEL;
  const embeddingDimensions = env.EMBEDDING_DIMENSIONS;

  return {
    async embedQuery(question) {
      return createQueryEmbedding(question, {
        apiKey: embeddingApiKey,
        provider: embeddingProvider,
        model: embeddingModel,
        dimensions: embeddingDimensions,
      });
    },
    async retrieve(embedding) {
      const { getDatabasePool } = await import("@/lib/db");
      return retrieveVerifiedScholarshipChunks(getDatabasePool(), embedding, {
        expectedDimensions: embeddingDimensions,
      });
    },
    async generateAnswer(prompt) {
      return generateGroundedAnswer({
        apiKey: groqApiKey,
        model: groqModel,
        prompt,
      });
    },
  };
}

export async function answerGroundedChat(
  pool: Pool,
  input: {
    userId: string;
    message: string;
    sessionId?: number;
  },
  dependencies: RagChatDependencies,
): Promise<GroundedChatResult> {
  const question = input.message.trim();
  if (!question) {
    throw new Error("Provide a valid message.");
  }

  console.info("RAG chat started", {
    userId: input.userId,
    sessionId: input.sessionId ?? null,
    questionLength: question.length,
  });

  if (input.sessionId) {
    const existing = await pool.query(
      `SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      [input.sessionId, input.userId],
    );
    if (!existing.rowCount) {
      throw new RagSessionNotFoundError();
    }
  }

  const embedding = await dependencies.embedQuery(question);
  const chunks = await dependencies.retrieve(embedding);
  const citations = toCitations(chunks);
  const context = buildGroundedContext(chunks);

  console.info("RAG retrieval complete", {
    userId: input.userId,
    matchCount: chunks.length,
    topSimilarity: chunks[0]?.similarity ?? null,
  });

  const answer =
    chunks.length === 0
      ? INSUFFICIENT_EVIDENCE_MESSAGE
      : await dependencies.generateAnswer(
          buildGroundedUserPrompt(question, context),
        );

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sessionId = await loadOrCreateSession(
      client,
      input.userId,
      input.sessionId,
      question,
    );
    await client.query(
      `INSERT INTO chat_messages (session_id, role, content, citations)
       VALUES ($1, 'user', $2, '[]'::jsonb)`,
      [sessionId, question],
    );
    await client.query(
      `INSERT INTO chat_messages (session_id, role, content, citations)
       VALUES ($1, 'assistant', $2, $3::jsonb)`,
      [sessionId, answer, JSON.stringify(citations)],
    );
    await client.query("COMMIT");
    return {
      session_id: sessionId,
      answer,
      response: answer,
      citations,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Unable to roll back grounded chat persistence.", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
