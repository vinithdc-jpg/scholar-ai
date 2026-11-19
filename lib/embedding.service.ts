import { pipeline } from "@huggingface/transformers";

export const EMBEDDING_MODEL = "Xenova/multilingual-e5-small";
export const EMBEDDING_DIMENSIONS = 384;
export const SUPPORTED_EMBEDDING_PROVIDERS = ["local", "huggingface"] as const;
export type SupportedEmbeddingProvider = (typeof SUPPORTED_EMBEDDING_PROVIDERS)[number];
export const SUPPORTED_EMBEDDING_PROVIDER = "local";

export type EmbeddingResponse = number[];

export type EmbeddingRequestOptions = {
  apiKey?: string;
  model?: string;
  dimensions?: number;
  provider?: string;
  type?: "query" | "passage";
};

type FeatureExtractor = (
  text: string,
  options?: { pooling?: string; normalize?: boolean },
) => Promise<{ data: Float32Array | number[] }>;

let localExtractor: FeatureExtractor | null = null;
let localLoadingPromise: Promise<FeatureExtractor> | null = null;

async function getLocalExtractor(modelName: string): Promise<FeatureExtractor> {
  if (localExtractor) return localExtractor;

  if (!localLoadingPromise) {
    localLoadingPromise = pipeline("feature-extraction", modelName) as unknown as Promise<FeatureExtractor>;
  }

  try {
    localExtractor = await localLoadingPromise;
    return localExtractor;
  } catch (error) {
    localLoadingPromise = null;
    throw error;
  }
}

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

function parseRemoteEmbeddingResponse(payload: unknown): number[] {
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
  if (!SUPPORTED_EMBEDDING_PROVIDERS.includes(configured as SupportedEmbeddingProvider)) {
    throw new Error(
      `Unsupported embedding provider "${provider}". Supported providers: ${SUPPORTED_EMBEDDING_PROVIDERS.join(", ")}.`,
    );
  }
}

async function createRemoteHuggingFaceEmbedding(
  cleanText: string,
  options: EmbeddingRequestOptions,
  expectedDimensions: number,
): Promise<number[]> {
  if (!options.apiKey?.trim()) {
    throw new Error("An API key is required for the huggingface remote embedding provider.");
  }

  const model = options.model?.trim() || EMBEDDING_MODEL;
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

  const embedding = parseRemoteEmbeddingResponse(await response.json());
  if (embedding.length !== expectedDimensions) {
    throw new Error(
      `Expected ${expectedDimensions} embedding dimensions, received ${embedding.length}.`,
    );
  }

  return embedding;
}

async function createLocalEmbedding(
  cleanText: string,
  modelName: string,
  expectedDimensions: number,
  type: "query" | "passage" = "passage",
): Promise<number[]> {
  const extractor = await getLocalExtractor(modelName);
  const formattedText =
    modelName.toLowerCase().includes("e5") &&
    !cleanText.startsWith("query: ") &&
    !cleanText.startsWith("passage: ")
      ? `${type}: ${cleanText}`
      : cleanText;

  const output = await extractor(formattedText, {
    pooling: "mean",
    normalize: true,
  });

  const embedding = Array.from(output.data);
  if (embedding.length !== expectedDimensions) {
    throw new Error(
      `Expected ${expectedDimensions} embedding dimensions, received ${embedding.length}.`,
    );
  }

  return embedding;
}

export async function createEmbedding(
  text: string,
  options: EmbeddingRequestOptions = {},
): Promise<EmbeddingResponse> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Cannot create an embedding from empty text.");
  }

  const provider = options.provider?.trim().toLowerCase() || SUPPORTED_EMBEDDING_PROVIDER;
  assertSupportedEmbeddingProvider(provider);

  const model = options.model?.trim() || EMBEDDING_MODEL;
  const expectedDimensions = options.dimensions ?? EMBEDDING_DIMENSIONS;

  if (provider === "local") {
    return createLocalEmbedding(cleanText, model, expectedDimensions, options.type ?? "passage");
  }

  return createRemoteHuggingFaceEmbedding(cleanText, options, expectedDimensions);
}

export async function createQueryEmbedding(
  text: string,
  options: EmbeddingRequestOptions = {},
): Promise<EmbeddingResponse> {
  return createEmbedding(text, { ...options, type: "query" });
}
