export const EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-0.6B";
export const EMBEDDING_DIMENSIONS = 1024;
export const SUPPORTED_EMBEDDING_PROVIDER = "huggingface";

export type EmbeddingResponse = number[];

export type EmbeddingRequestOptions = {
  apiKey: string;
  model?: string;
  dimensions?: number;
  provider?: string;
};

function meanPool(rows: number[][]): number[] {
  const dimensions = rows[0].length;
  const pooled = new Array<number>(dimensions).fill(0);
  for (const row of rows) {
    for (let index = 0; index < dimensions; index += 1) {
      pooled[index] += row[index];
    }
  }
  return pooled.map((value) => value / rows.length);
}

function parseEmbeddingResponse(payload: unknown): number[] {
  if (Array.isArray(payload) && payload.every((value) => typeof value === "number")) {
    return payload as number[];
  }

  if (
    Array.isArray(payload) &&
    payload.length > 0 &&
    payload.every(
      (row) =>
        Array.isArray(row) && row.every((value: unknown) => typeof value === "number"),
    )
  ) {
    const rows = payload as number[][];
    if (rows.length === 1) return rows[0];
    return meanPool(rows);
  }

  throw new Error("The embedding provider returned an invalid embedding response.");
}

export function toPgVector(embedding: number[]): string {
  if (!embedding.length || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("Cannot convert an invalid embedding to a PostgreSQL vector.");
  }
  return `[${embedding.join(",")}]`;
}

export function assertSupportedEmbeddingProvider(provider: string | undefined) {
  const configured = provider?.trim().toLowerCase();
  if (!configured) {
    throw new Error("An embedding provider is not configured.");
  }
  if (configured !== SUPPORTED_EMBEDDING_PROVIDER) {
    throw new Error(
      `Unsupported embedding provider "${provider}". This application uses ${SUPPORTED_EMBEDDING_PROVIDER}.`,
    );
  }
}

export async function createEmbedding(
  text: string,
  options: EmbeddingRequestOptions,
): Promise<EmbeddingResponse> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Cannot create an embedding from empty text.");
  }

  assertSupportedEmbeddingProvider(options.provider ?? SUPPORTED_EMBEDDING_PROVIDER);

  const model = options.model?.trim() || EMBEDDING_MODEL;
  const expectedDimensions = options.dimensions ?? EMBEDDING_DIMENSIONS;
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model}/pipeline/feature-extraction`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: cleanText.slice(0, 8000),
        options: { wait_for_model: true },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Embedding provider request failed (${response.status}): ${detail || response.statusText}`,
    );
  }

  const embedding = parseEmbeddingResponse(await response.json());
  if (embedding.length !== expectedDimensions) {
    throw new Error(
      `Expected ${expectedDimensions} embedding dimensions, received ${embedding.length}.`,
    );
  }

  return embedding;
}

export async function createQueryEmbedding(
  text: string,
  options: EmbeddingRequestOptions,
): Promise<EmbeddingResponse> {
  return createEmbedding(text, options);
}
