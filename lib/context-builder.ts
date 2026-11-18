import type { RetrievedChunk } from "@/lib/retrieval.service";

export const INSUFFICIENT_EVIDENCE_MESSAGE =
  "The available verified scholarship information is insufficient to answer that question. I will not guess or invent scholarship details. Try a more specific question, or confirm the information with an official source.";

export function buildGroundedContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  return chunks
    .map((chunk, index) => {
      const location = [
        `source: ${chunk.source_title}`,
        `scholarship_id: ${chunk.scholarship_id}`,
        chunk.section ? `section: ${chunk.section}` : null,
        chunk.page_number ? `page: ${chunk.page_number}` : null,
        `similarity: ${chunk.similarity.toFixed(3)}`,
      ]
        .filter(Boolean)
        .join(" | ");

      return `[${index + 1}] ${location}\n${chunk.content}`;
    })
    .join("\n\n");
}

export function buildGroundedUserPrompt(question: string, context: string): string {
  return [
    "Answer the student using only the numbered evidence below.",
    "If the evidence does not contain the answer, say the available information is insufficient.",
    "Do not invent scholarships, amounts, dates, eligibility rules, or citations.",
    "When you use a fact, mention the matching evidence number like [1].",
    "",
    `Student question:\n${question.trim()}`,
    "",
    `Evidence:\n${context}`,
  ].join("\n");
}
