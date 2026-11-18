export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

const GROUNDED_SYSTEM_PROMPT = [
  "You are ScholarAI, a scholarship assistant that answers only from retrieved, verified source excerpts.",
  "Never fabricate scholarship names, amounts, deadlines, eligibility rules, or citations.",
  "If the evidence is missing or too weak, say the available information is insufficient.",
  "Keep the tone practical and concise.",
].join(" ");

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

function extractMessageContent(payload: GroqChatResponse): string {
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }
  return "";
}

export async function generateGroundedAnswer(options: {
  apiKey: string;
  model?: string;
  prompt: string;
}): Promise<string> {
  const model = options.model?.trim() || DEFAULT_GROQ_MODEL;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: "system", content: GROUNDED_SYSTEM_PROMPT },
        { role: "user", content: options.prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Groq request failed (${response.status}): ${detail || response.statusText}`,
    );
  }

  const payload = (await response.json()) as GroqChatResponse;
  const answer = extractMessageContent(payload);
  if (!answer) {
    throw new Error("Groq returned an empty grounded answer.");
  }
  return answer;
}
