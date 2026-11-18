import type { Pool, PoolClient } from "pg";
import { EMBEDDING_DIMENSIONS, toPgVector } from "@/lib/embedding.service";

export const DEFAULT_SIMILARITY_THRESHOLD = 0.4;
export const DEFAULT_RETRIEVAL_LIMIT = 8;

export type RetrievedChunk = {
  id: number;
  content: string;
  similarity: number;
  scholarship_id: number;
  source_title: string;
  section: string | null;
  page_number: number | null;
  document_id: number;
};

type Queryable = Pool | PoolClient;

function asFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function sectionFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  return (
    asOptionalText(record.section_title) ??
    asOptionalText(record.section) ??
    null
  );
}

export async function retrieveVerifiedScholarshipChunks(
  db: Queryable,
  embedding: number[],
  options: {
    limit?: number;
    similarityThreshold?: number;
    expectedDimensions?: number;
  } = {},
): Promise<RetrievedChunk[]> {
  const expectedDimensions = options.expectedDimensions ?? EMBEDDING_DIMENSIONS;
  if (embedding.length !== expectedDimensions) {
    throw new Error(
      `Query embedding has ${embedding.length} dimensions; expected ${expectedDimensions} to match document_chunks.embedding.`,
    );
  }

  const limit = Math.min(Math.max(options.limit ?? DEFAULT_RETRIEVAL_LIMIT, 1), 20);
  const similarityThreshold =
    options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
  if (!(similarityThreshold >= 0 && similarityThreshold <= 1)) {
    throw new Error("Similarity threshold must be between 0 and 1.");
  }

  const result = await db.query<{
    id: string | number;
    document_id: string | number;
    scholarship_id: string | number;
    content: string;
    page_number: number | null;
    metadata: unknown;
    source_title: string | null;
    scholarship_name: string | null;
    similarity: string | number;
  }>(
    `SELECT
       c.id,
       c.document_id,
       c.scholarship_id,
       c.content,
       c.page_number,
       c.metadata,
       d.title AS source_title,
       s.name AS scholarship_name,
       (1 - (c.embedding <=> $1::vector)) AS similarity
     FROM document_chunks c
     INNER JOIN scholarship_documents d ON d.id = c.document_id
     INNER JOIN scholarships s ON s.id = c.scholarship_id
     WHERE c.embedding IS NOT NULL
       AND c.scholarship_id IS NOT NULL
       AND d.verification_status = 'verified'
       AND d.processing_status = 'completed'
       AND s.verification_status = 'verified'
       AND 1 - (c.embedding <=> $1::vector) >= $2
     ORDER BY c.embedding <=> $1::vector ASC, c.id ASC
     LIMIT $3`,
    [toPgVector(embedding), similarityThreshold, limit],
  );

  return result.rows.flatMap((row) => {
    const scholarshipId = asFiniteNumber(row.scholarship_id);
    const similarity = asFiniteNumber(row.similarity);
    const id = asFiniteNumber(row.id);
    const documentId = asFiniteNumber(row.document_id);
    const content = row.content?.trim();
    if (
      scholarshipId === null ||
      similarity === null ||
      id === null ||
      documentId === null ||
      !content
    ) {
      return [];
    }

    return [
      {
        id,
        document_id: documentId,
        content,
        similarity,
        scholarship_id: scholarshipId,
        source_title:
          asOptionalText(row.source_title) ??
          asOptionalText(row.scholarship_name) ??
          "Verified scholarship source",
        section: sectionFromMetadata(row.metadata),
        page_number: asFiniteNumber(row.page_number),
      },
    ];
  });
}

export function toCitations(chunks: RetrievedChunk[]) {
  const seen = new Set<string>();
  const citations: Array<{
    source_title: string;
    scholarship_id: number;
    section: string | null;
    page_number: number | null;
  }> = [];

  for (const chunk of chunks) {
    const key = [
      chunk.scholarship_id,
      chunk.source_title,
      chunk.section ?? "",
      chunk.page_number ?? "",
    ].join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({
      source_title: chunk.source_title,
      scholarship_id: chunk.scholarship_id,
      section: chunk.section,
      page_number: chunk.page_number,
    });
  }

  return citations;
}
