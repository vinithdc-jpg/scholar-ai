import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { POST } from "../app/api/ai/chat/route";
import {
  buildGroundedContext,
  buildGroundedUserPrompt,
  INSUFFICIENT_EVIDENCE_MESSAGE,
} from "../lib/context-builder";
import {
  createQueryEmbedding,
  EMBEDDING_DIMENSIONS,
  toPgVector,
} from "../lib/embedding.service";
import { getServerEnv } from "../lib/env";
import { generateGroundedAnswer } from "../lib/groq.service";
import {
  answerGroundedChat,
  RagSessionNotFoundError,
} from "../lib/rag-chat.service";
import {
  retrieveVerifiedScholarshipChunks,
  toCitations,
  type RetrievedChunk,
} from "../lib/retrieval.service";

loadEnvConfig(process.cwd());

function unitVector(index: number, value = 1) {
  const embedding = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  embedding[index] = value;
  return embedding;
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let i = 0; i < left.length; i += 1) {
    dot += left[i] * right[i];
    leftNorm += left[i] * left[i];
    rightNorm += right[i] * right[i];
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

async function testContextBuilder() {
  const chunks: RetrievedChunk[] = [
    {
      id: 1,
      document_id: 10,
      content: "Deadline is 15 January 2027.",
      similarity: 0.91,
      scholarship_id: 42,
      source_title: "Pearson scholarship notice",
      section: "application_deadline",
      page_number: 2,
    },
  ];
  const context = buildGroundedContext(chunks);
  assert.match(context, /\[1\]/);
  assert.match(context, /scholarship_id: 42/);
  assert.match(context, /page: 2/);
  const prompt = buildGroundedUserPrompt("When is the deadline?", context);
  assert.match(prompt, /Student question/);
  assert.match(prompt, /Evidence/);
}

async function testAuthAndValidation() {
  const unauthorized = await POST(
    new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What scholarships are open?" }),
    }),
  );
  assert.equal(unauthorized.status, 401);

  const invalidToken = await POST(
    new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: {
        Authorization: "Bearer not-a-firebase-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "What scholarships are open?" }),
    }),
  );
  assert.equal(invalidToken.status, 401);
}

async function withFixtures(pool: Pool) {
  const stamp = Date.now();
  const user = await pool.query<{ id: string }>(
    `INSERT INTO users (firebase_uid, email, full_name, role)
     VALUES ($1, $2, 'RAG Test User', 'student')
     RETURNING id`,
    [`rag-test-${stamp}`, `rag-test-${stamp}@example.com`],
  );
  const userId = user.rows[0].id;

  const scholarship = await pool.query<{ id: string }>(
    `INSERT INTO scholarships (
       name, provider, description, verification_status, status
     ) VALUES ($1, 'Test Provider', 'Verified test scholarship', 'verified', 'published')
     RETURNING id`,
    [`RAG Verified Scholarship ${stamp}`],
  );
  const unverifiedScholarship = await pool.query<{ id: string }>(
    `INSERT INTO scholarships (
       name, provider, description, verification_status, status
     ) VALUES ($1, 'Test Provider', 'Unverified test scholarship', 'pending', 'published')
     RETURNING id`,
    [`RAG Unverified Scholarship ${stamp}`],
  );

  const verifiedDoc = await pool.query<{ id: string }>(
    `INSERT INTO scholarship_documents (
       scholarship_id, title, document_type, original_filename, mime_type,
       file_size, verification_status, processing_status, page_count
     ) VALUES ($1, 'Official handbook', 'text-ingestion', 'handbook.txt',
       'text/plain', 120, 'verified', 'completed', 3)
     RETURNING id`,
    [scholarship.rows[0].id],
  );
  const unverifiedDoc = await pool.query<{ id: string }>(
    `INSERT INTO scholarship_documents (
       scholarship_id, title, document_type, original_filename, mime_type,
       file_size, verification_status, processing_status
     ) VALUES ($1, 'Community notes', 'text-ingestion', 'notes.txt',
       'text/plain', 80, 'pending', 'completed')
     RETURNING id`,
    [unverifiedScholarship.rows[0].id],
  );
  const incompleteDoc = await pool.query<{ id: string }>(
    `INSERT INTO scholarship_documents (
       scholarship_id, title, document_type, original_filename, mime_type,
       file_size, verification_status, processing_status
     ) VALUES ($1, 'Incomplete scan', 'pdf-upload', 'scan.pdf',
       'application/pdf', 90, 'verified', 'processing')
     RETURNING id`,
    [scholarship.rows[0].id],
  );

  const relevant = unitVector(0);
  const noise = unitVector(1);
  await pool.query(
    `INSERT INTO document_chunks (
       document_id, scholarship_id, chunk_index, content, embedding, page_number, metadata
     ) VALUES
       ($1, $2, 0, 'The National Merit Award pays $5,000 and closes on 15 January 2027.', $3::vector, 2,
        '{"section":"application_deadline","section_title":"Application deadline"}'::jsonb),
       ($4, $5, 0, 'Unverified source should never be retrieved.', $3::vector, 1,
        '{"section":"overview"}'::jsonb),
       ($6, $2, 0, 'Incomplete processing should never be retrieved.', $3::vector, 1,
        '{"section":"overview"}'::jsonb)`,
    [
      verifiedDoc.rows[0].id,
      scholarship.rows[0].id,
      toPgVector(relevant),
      unverifiedDoc.rows[0].id,
      unverifiedScholarship.rows[0].id,
      incompleteDoc.rows[0].id,
    ],
  );

  return {
    userId,
    scholarshipId: Number(scholarship.rows[0].id),
    relevant,
    noise,
    async cleanup() {
      await pool.query("DELETE FROM chat_sessions WHERE user_id = $1", [userId]);
      await pool.query(
        "DELETE FROM scholarship_documents WHERE id = ANY($1::bigint[])",
        [
          [
            verifiedDoc.rows[0].id,
            unverifiedDoc.rows[0].id,
            incompleteDoc.rows[0].id,
          ],
        ],
      );
      await pool.query("DELETE FROM scholarships WHERE id = ANY($1::bigint[])", [
        [scholarship.rows[0].id, unverifiedScholarship.rows[0].id],
      ]);
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    },
  };
}

async function testRetrievalAndCitations(pool: Pool) {
  const fixtures = await withFixtures(pool);
  try {
    const matches = await retrieveVerifiedScholarshipChunks(pool, fixtures.relevant, {
      similarityThreshold: 0.5,
    });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].scholarship_id, fixtures.scholarshipId);
    assert.equal(matches[0].source_title, "Official handbook");
    assert.equal(matches[0].section, "Application deadline");
    assert.equal(matches[0].page_number, 2);
    assert.ok(matches[0].similarity >= 0.99);

    const citations = toCitations(matches);
    assert.deepEqual(citations, [
      {
        source_title: "Official handbook",
        scholarship_id: fixtures.scholarshipId,
        section: "Application deadline",
        page_number: 2,
      },
    ]);

    const empty = await retrieveVerifiedScholarshipChunks(pool, fixtures.noise, {
      similarityThreshold: 0.5,
    });
    assert.equal(empty.length, 0);
  } finally {
    await fixtures.cleanup();
  }
}

async function testFullChatFlow(pool: Pool) {
  const fixtures = await withFixtures(pool);
  try {
    const generated = await answerGroundedChat(
      pool,
      {
        userId: fixtures.userId,
        message: "What is the award amount and deadline?",
      },
      {
        embedQuery: async () => fixtures.relevant,
        retrieve: async (embedding) =>
          retrieveVerifiedScholarshipChunks(pool, embedding, {
            similarityThreshold: 0.5,
          }),
        generateAnswer: async (prompt) => {
          assert.match(prompt, /National Merit Award/);
          return "The award pays $5,000 and closes on 15 January 2027 [1].";
        },
      },
    );

    assert.match(generated.answer, /\$5,000/);
    assert.equal(generated.response, generated.answer);
    assert.equal(generated.citations.length, 1);
    assert.equal(generated.citations[0].scholarship_id, fixtures.scholarshipId);
    assert.equal(generated.citations[0].page_number, 2);

    const persisted = await pool.query(
      `SELECT role, content, citations
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at, id`,
      [generated.session_id],
    );
    assert.equal(persisted.rowCount, 2);
    assert.equal(persisted.rows[0].role, "user");
    assert.equal(persisted.rows[1].role, "assistant");
    assert.equal(
      persisted.rows[1].citations[0].source_title,
      "Official handbook",
    );

    const empty = await answerGroundedChat(
      pool,
      {
        userId: fixtures.userId,
        sessionId: generated.session_id,
        message: "What is the quantum physics prize?",
      },
      {
        embedQuery: async () => fixtures.noise,
        retrieve: async (embedding) =>
          retrieveVerifiedScholarshipChunks(pool, embedding, {
            similarityThreshold: 0.5,
          }),
        generateAnswer: async () => {
          throw new Error("Groq should not be called without evidence.");
        },
      },
    );
    assert.equal(empty.answer, INSUFFICIENT_EVIDENCE_MESSAGE);
    assert.deepEqual(empty.citations, []);

    await assert.rejects(
      () =>
        answerGroundedChat(
          pool,
          {
            userId: fixtures.userId,
            sessionId: 99999999,
            message: "Does this session exist?",
          },
          {
            embedQuery: async () => fixtures.relevant,
            retrieve: async () => [],
            generateAnswer: async () => "unused",
          },
        ),
      RagSessionNotFoundError,
    );
  } finally {
    await fixtures.cleanup();
  }
}

async function testLiveProviders() {
  const env = getServerEnv();
  if (
    (env.EMBEDDING_PROVIDER === "local" || env.EMBEDDING_API_KEY) &&
    env.EMBEDDING_MODEL &&
    env.EMBEDDING_PROVIDER
  ) {
    try {
      const relatedA = await createQueryEmbedding(
        "National Merit Award deadline 15 January 2027",
        {
          apiKey: env.EMBEDDING_API_KEY,
          provider: env.EMBEDDING_PROVIDER,
          model: env.EMBEDDING_MODEL,
          dimensions: env.EMBEDDING_DIMENSIONS,
        },
      );
      const relatedB = await createQueryEmbedding(
        "When does the National Merit Award application close?",
        {
          apiKey: env.EMBEDDING_API_KEY,
          provider: env.EMBEDDING_PROVIDER,
          model: env.EMBEDDING_MODEL,
          dimensions: env.EMBEDDING_DIMENSIONS,
        },
      );
      const unrelated = await createQueryEmbedding("How to bake sourdough bread", {
        apiKey: env.EMBEDDING_API_KEY,
        provider: env.EMBEDDING_PROVIDER,
        model: env.EMBEDDING_MODEL,
        dimensions: env.EMBEDDING_DIMENSIONS,
      });
      assert.equal(relatedA.length, env.EMBEDDING_DIMENSIONS ?? EMBEDDING_DIMENSIONS);
      assert.ok(
        cosineSimilarity(relatedA, relatedB) > cosineSimilarity(relatedA, unrelated),
      );
      console.log("Query embedding: passed");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes("(402)") ||
        message.includes("pre-paid credits") ||
        message.includes("(503)") ||
        message.includes("circuit breaker") ||
        message.includes("currently failing")
      ) {
        console.log(`Query embedding: skipped (provider transient error — ${message})`);
      } else {
        throw error;
      }
    }
  } else {
    console.log("Query embedding: skipped (embedding provider is not configured)");
  }

  if (env.GROQ_API_KEY) {
    const answer = await generateGroundedAnswer({
      apiKey: env.GROQ_API_KEY,
      model: env.GROQ_MODEL,
      prompt: buildGroundedUserPrompt(
        "What is the award amount?",
        "[1] source: Official handbook | scholarship_id: 42 | section: Scholarship benefits\nThe award pays $5,000.",
      ),
    });
    assert.match(answer.toLowerCase(), /5,000|5000/);
    console.log("Groq generation: passed");
  } else {
    console.log("Groq generation: skipped (GROQ_API_KEY is not configured)");
  }
}

async function main() {
  await testContextBuilder();
  console.log("Context builder: passed");

  await testAuthAndValidation();
  console.log("Authentication and validation: passed");

  const env = getServerEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    await testRetrievalAndCitations(pool);
    console.log("Retrieval, verified-source filtering, citations, empty retrieval: passed");
    await testFullChatFlow(pool);
    console.log("Complete grounded chat persistence flow: passed");
  } finally {
    await pool.end();
  }

  await testLiveProviders();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
