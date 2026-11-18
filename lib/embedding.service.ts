export const EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-0.6B";
export const EMBEDDING_DIMENSIONS = 1024;

export type EmbeddingResponse = number[];

function parseEmbeddingResponse(payload: unknown): number[] {
  if (Array.isArray(payload) && payload.every((value) => typeof value === "number")) {
    return payload as number[];
  }

  if (
    Array.isArray(payload) &&
    payload.length === 1 &&
    Array.isArray(payload[0]) &&
    payload[0].every((value: unknown) => typeof value === "number")
  ) {
    return payload[0] as number[];
  }

  throw new Error("The embedding provider returned an invalid embedding response.");
}

export async function createEmbedding(
  text: string,
  options: {
    apiKey: string;
    model?: string;
  },
): Promise<EmbeddingResponse> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Cannot create an embedding from empty text.");
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
        inputs: cleanText,
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
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS} embedding dimensions, received ${embedding.length}.`,
    );
  }

  return embedding;
}
