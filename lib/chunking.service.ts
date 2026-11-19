import {
  normalizeScholarshipText,
  type ScholarshipTextInput,
} from "@/lib/text-normalizer";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/embedding.service";

export const SCHOLARSHIP_CHUNK_SECTIONS = [
  "overview",
  "eligibility_criteria",
  "academic_requirements",
  "income_requirements",
  "scholarship_benefits",
  "required_documents",
  "application_deadline",
] as const;

export type ScholarshipChunkSection =
  (typeof SCHOLARSHIP_CHUNK_SECTIONS)[number];

export type ScholarshipChunkMetadata = {
  scholarship_id: number | string | null;
  source_id: string | null;
  source_name: string | null;
  source_url: string | null;
  academic_year: string | null;
  verification_status: "pending" | "verified" | "rejected";
  source_type:
    | "community_submission"
    | "official_source"
    | "pdf_import"
    | "manual_entry";
  section: ScholarshipChunkSection;
  section_title: string;
  embedding_model: string;
  embedding_dimensions: number;
  trusted_retrieval: false;
  language: "en";
};

export type ScholarshipChunk = {
  section: ScholarshipChunkSection;
  section_title: string;
  chunk_index: number;
  content: string;
  metadata: ScholarshipChunkMetadata;
};

export type ScholarshipChunkInput = ScholarshipTextInput & {
  scholarship_id: number | string | null;
  source_id?: string | null;
  source_name?: string | null;
  source_type?: ScholarshipChunkMetadata["source_type"];
  source_url?: string | null;
  academic_year?: string | null;
  verification_status?: ScholarshipChunkMetadata["verification_status"];
  embedded_text?: string;
};

function sanitizeText(value: string | null | undefined) {
  return (
    value
      ?.replace(/\s+/g, " ")
      .replace(/[\u0000-\u001F\u007F]+/g, "")
      .trim() ?? ""
  );
}

function buildSentence(label: string, value: string | null | undefined) {
  const clean = sanitizeText(value);
  return clean ? `${label}: ${clean}.` : "";
}

function buildChunkList(
  title: string,
  values: Array<string | null | undefined>,
) {
  const cleanValues = values
    .map((value) => sanitizeText(value))
    .filter(Boolean);
  return cleanValues.length ? `${title}: ${cleanValues.join(", ")}.` : "";
}

export function createScholarshipChunks(
  input: ScholarshipChunkInput,
): ScholarshipChunk[] {
  const normalizedText = normalizeScholarshipText(input);
  const metadataBase: Omit<
    ScholarshipChunkMetadata,
    "section" | "section_title"
  > = {
    scholarship_id: input.scholarship_id ?? null,
    source_id:
      input.source_id ??
      `scholarship:${String(input.scholarship_id ?? "draft")}`,
    source_name: input.source_name ?? "community_submission",
    source_url: input.source_url ?? null,
    academic_year: input.academic_year ?? null,
    verification_status: input.verification_status ?? "pending",
    source_type: input.source_type ?? "community_submission",
    embedding_model: EMBEDDING_MODEL,
    embedding_dimensions: EMBEDDING_DIMENSIONS,
    trusted_retrieval: false,
    language: "en",
  };

  const sections: Array<{
    key: ScholarshipChunkSection;
    title: string;
    content: string;
  }> = [
    {
      key: "overview",
      title: "Scholarship overview",
      content: [
        normalizedText,
        buildSentence(
          "Official source",
          input.official_source_url ?? input.source_url,
        ),
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      key: "eligibility_criteria",
      title: "Eligibility criteria",
      content: [
        buildSentence(
          "Eligible education levels",
          input.education_levels?.join(", "),
        ),
        buildSentence("Eligible courses", input.eligible_courses?.join(", ")),
        buildSentence("Eligible states", input.eligible_states?.join(", ")),
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      key: "academic_requirements",
      title: "Academic requirements",
      content: [
        buildSentence("Academic year", input.academic_year),
        buildChunkList("Academic requirements", [
          input.scholarship_type,
          input.description,
        ]),
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      key: "income_requirements",
      title: "Income requirements",
      content: [
        buildSentence(
          "Income limit",
          input.income_limit ? `$${input.income_limit}` : null,
        ),
        buildSentence(
          "Application threshold",
          input.income_limit ? `${input.income_limit} USD` : null,
        ),
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      key: "scholarship_benefits",
      title: "Scholarship benefits",
      content: buildChunkList("Benefits", input.benefits ?? []),
    },
    {
      key: "required_documents",
      title: "Required documents",
      content: buildSentence("Required documents", input.description),
    },
    {
      key: "application_deadline",
      title: "Application deadline",
      content: [
        buildSentence("Application opens", input.application_start_date),
        buildSentence("Application deadline", input.application_deadline),
      ]
        .filter(Boolean)
        .join(" "),
    },
  ];

  const chunks: ScholarshipChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const content = section.content.trim();
    if (!content) continue;
    chunks.push({
      section: section.key,
      section_title: section.title,
      chunk_index: chunkIndex,
      content,
      metadata: {
        ...metadataBase,
        section: section.key,
        section_title: section.title,
      },
    });
    chunkIndex += 1;
  }

  if (chunks.length === 0) {
    throw new Error(
      "No valid scholarship chunks were generated from the provided scholarship data.",
    );
  }

  return chunks;
}

export function prepareScholarshipChunks(input: ScholarshipChunkInput) {
  const chunks = createScholarshipChunks(input);
  return chunks.map((chunk) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      source_id: chunk.metadata.source_id,
      source_name: chunk.metadata.source_name,
      source_url: chunk.metadata.source_url,
      academic_year: chunk.metadata.academic_year,
      verification_status: chunk.metadata.verification_status,
      source_type: chunk.metadata.source_type,
      embedding_model: chunk.metadata.embedding_model,
      embedding_dimensions: chunk.metadata.embedding_dimensions,
    },
  }));
}
