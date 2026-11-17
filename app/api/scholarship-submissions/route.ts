import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import {
  normalizeScholarshipInput,
  scholarshipFields,
  scholarshipSchema,
} from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";
import {
  SCHOLARSHIP_DOCUMENTS_BUCKET,
  removeStorageObject,
  storageError,
  uploadPdfToStorage,
} from "@/lib/supabase-storage";

const MAX_PDF_SIZE = 500 * 1024;

const httpsUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    (value) => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Use an HTTPS URL." },
  );

const createSchema = scholarshipSchema
  .omit({ status: true, verification_status: true })
  .extend({
    description: z.string().trim().max(5000).default(""),
    education_levels: z
      .array(z.string().trim().min(1).max(120))
      .max(25)
      .optional(),
    eligible_courses: z
      .array(z.string().trim().min(1).max(255))
      .max(25)
      .optional(),
    eligible_states: z
      .array(z.string().trim().min(1).max(120))
      .max(25)
      .optional(),
    benefits: z
      .array(z.string().trim().min(1).max(500))
      .max(25)
      .optional(),
    official_application_url: httpsUrl.nullable().optional(),
    official_source_url: httpsUrl,
  });

async function uploadPdf(file: File) {
  if (file.size > MAX_PDF_SIZE) {
    return {
      error: NextResponse.json(
        { error: "The PDF must be 500 KB or smaller." },
        { status: 413 },
      ),
    };
  }

  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    return {
      error: NextResponse.json(
        { error: "Upload a PDF file." },
        { status: 400 },
      ),
    };
  }

  const signatureBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signatureBytes) !== "%PDF-") {
    return {
      error: NextResponse.json(
        { error: "The uploaded file is not a valid PDF." },
        { status: 400 },
      ),
    };
  }

  const path = `scholarship-submissions/${randomUUID()}.pdf`;
  try {
    await uploadPdfToStorage(path, file);
    return { path };
  } catch (error) {
    return { error: storageError("Unable to upload the scholarship PDF.", error) };
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;

  let submission: unknown;
  let pdf: File | null = null;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_PDF_SIZE + 128 * 1024
    ) {
      return NextResponse.json(
        { error: "The scholarship submission request is too large." },
        { status: 413 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid multipart form data." },
        { status: 400 },
      );
    }
    const scholarship = formData.get("scholarship");
    const uploadedFile = formData.get("pdf");
    if (typeof scholarship !== "string") {
      return NextResponse.json(
        { error: "Scholarship details are required." },
        { status: 400 },
      );
    }
    if (uploadedFile !== null && !(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "The PDF upload must be a file." },
        { status: 400 },
      );
    }
    try {
      submission = JSON.parse(scholarship);
    } catch {
      return NextResponse.json(
        { error: "Scholarship details must be valid JSON." },
        { status: 400 },
      );
    }
    if (uploadedFile instanceof File && uploadedFile.size > 0) pdf = uploadedFile;
  } else {
    const parsedJson = await readJson(request, createSchema);
    if (parsedJson.response) return parsedJson.response;
    submission = parsedJson.data;
  }

  const parsed = createSchema.safeParse(submission);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Request validation failed.",
        details: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  let documentPath: string | null = null;
  if (pdf) {
    const uploadResult = await uploadPdf(pdf);
    if ("error" in uploadResult) return uploadResult.error;
    documentPath = uploadResult.path;
  }

  const values = normalizeScholarshipInput({
    ...parsed.data,
    status: "published",
    verification_status: "pending",
  });

  let client: PoolClient | undefined;
  let transactionStarted = false;
  try {
    client = await getDatabasePool().connect();
    await client.query("BEGIN");
    transactionStarted = true;
    const result = await client.query(
      `INSERT INTO scholarships (${scholarshipFields.join(", ")}, submitted_by)
       VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")}, $${values.length + 1})
       RETURNING id, name, provider, status, verification_status`,
      [...values, auth.user.id],
    );

    if (pdf && documentPath) {
      await client.query(
        `INSERT INTO scholarship_documents (
           scholarship_id, title, document_type, storage_bucket, storage_path,
           original_filename, mime_type, file_size, source_url, academic_year,
           uploaded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          result.rows[0].id,
          parsed.data.name,
          "Scholarship details",
          SCHOLARSHIP_DOCUMENTS_BUCKET,
          documentPath,
          pdf.name,
          "application/pdf",
          pdf.size,
          parsed.data.official_source_url,
          parsed.data.academic_year ?? null,
          auth.user.id,
        ],
      );
    }

    await client.query("COMMIT");
    transactionStarted = false;
    return NextResponse.json({ scholarship: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Unable to roll back scholarship submission.", rollbackError);
      }
    }
    if (documentPath) {
      try {
        await removeStorageObject(SCHOLARSHIP_DOCUMENTS_BUCKET, documentPath);
      } catch (cleanupError) {
        console.error("Unable to remove the unlinked scholarship PDF.", cleanupError);
      }
    }
    return databaseError("Unable to publish the scholarship submission.", error);
  } finally {
    client?.release();
  }
}