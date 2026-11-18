import assert from "node:assert/strict";
import { createScholarshipChunks } from "@/lib/chunking.service";
import { normalizeScholarshipText } from "@/lib/text-normalizer";

const sampleScholarship = {
  name: "Lester B. Pearson International Scholarship",
  provider: "University of Toronto",
  description:
    "A fully funded international award for students who demonstrate outstanding academic achievement, leadership, and service to their communities.",
  scholarship_type: "Merit-based international",
  education_levels: ["Undergraduate"],
  eligible_courses: ["Any undergraduate program"],
  eligible_states: ["All provinces and territories", "International"],
  benefits: [
    "Full tuition",
    "Books and incidental fees",
    "Housing support",
    "Research and leadership development",
  ],
  amount: 52000,
  income_limit: 80000,
  application_start_date: "2026-09-01",
  application_deadline: "2027-01-15",
  official_application_url: "https://www.utoronto.ca/admissions/international-scholarships",
  official_source_url: "https://www.utoronto.ca/admissions/international-scholarships",
  academic_year: "2026-2027",
  source_id: "pearson-2026-01",
  source_name: "University of Toronto",
  source_type: "official_source",
};

const normalized = normalizeScholarshipText(sampleScholarship);
assert.ok(normalized.includes("Lester B. Pearson International Scholarship"));
assert.ok(normalized.includes("Scholarship type: Merit-based international"));
assert.ok(normalized.includes("Award amount: $52,000"));

const chunks = createScholarshipChunks({
  ...sampleScholarship,
  scholarship_id: 42,
  verification_status: "pending",
  source_id: "pearson-2026-01",
  source_name: "University of Toronto",
  source_type: "official_source",
  academic_year: sampleScholarship.academic_year,
  source_url: sampleScholarship.official_source_url,
});

assert.ok(chunks.length >= 4, `Expected at least 4 chunks. Received ${chunks.length}.`);
assert.ok(
  chunks.every((chunk, index) => chunk.chunk_index === index),
  "Chunk indexes must be sequential and zero-based.",
);
assert.ok(
  chunks.some((chunk) => chunk.metadata.section === "overview"),
  "Overview chunk must be present.",
);
assert.ok(
  chunks.some((chunk) => chunk.metadata.section === "application_deadline"),
  "Application deadline chunk must be present.",
);
assert.equal(chunks[0].metadata.embedding_dimensions, 1024);
assert.equal(chunks[0].metadata.embedding_model, "Qwen/Qwen3-Embedding-0.6B");
assert.equal(chunks[0].metadata.trusted_retrieval, false);

console.log(`Normalized scholarship text length: ${normalized.length} characters`);
console.log(`Generated chunks: ${chunks.length}`);
for (const chunk of chunks) {
  console.log(`- ${chunk.metadata.section}: ${chunk.content.slice(0, 90)}`);
}
