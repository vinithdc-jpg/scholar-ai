import { NextResponse } from "next/server";
import { z } from "zod";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { uploadPdf } from "@/lib/api/cloudinary";
import { getDatabasePool } from "@/lib/db";
import { getServerEnv } from "@/lib/env";

const maxFileSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireRoles(request, ["content_admin", "super_admin"]);
  if (isResponse(auth)) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data." },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A PDF file is required in the file field." },
      { status: 400 },
    );
  }
  if (
    file.type !== "application/pdf" ||
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json(
      { error: "Only PDF documents can be uploaded." },
      { status: 415 },
    );
  }
  if (!(await file.slice(0, 5).text()).startsWith("%PDF-")) {
    return NextResponse.json(
      { error: "The uploaded file is not a valid PDF." },
      { status: 415 },
    );
  }
  if (file.size < 1 || file.size > maxFileSize) {
    return NextResponse.json(
      { error: "PDF files must be smaller than 10 MB." },
      { status: 413 },
    );
  }

  const metadataSchema = z.object({
    title: z.string().trim().min(1).max(255),
    document_type: z.string().trim().min(1).max(120),
    scholarship_id: z.coerce.number().int().positive().optional(),
    academic_year: z.string().max(32).optional(),
    source_url: z.string().url().optional(),
  });
  const metadata = metadataSchema.safeParse({
    title: form.get("title"),
    document_type: form.get("document_type"),
    scholarship_id: form.get("scholarship_id") || undefined,
    academic_year: form.get("academic_year") || undefined,
    source_url: form.get("source_url") || undefined,
  });
  if (!metadata.success) {
    return NextResponse.json(
      {
        error: "Document metadata is invalid.",
        details: metadata.error.issues,
      },
      { status: 400 },
    );
  }

  if (!getServerEnv().CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json(
      { error: "Cloudinary is not configured." },
      { status: 503 },
    );
  }

  try {
    const uploaded = await uploadPdf(file);
    const result = await getDatabasePool().query(
      `INSERT INTO scholarship_documents (
         scholarship_id, title, document_type, cloudinary_public_id,
         cloudinary_secure_url, original_filename, mime_type, file_size,
         source_url, academic_year, uploaded_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, scholarship_id, title, document_type, cloudinary_secure_url,
                 original_filename, mime_type, file_size, source_url,
                 academic_year, verification_status, processing_status, created_at`,
      [
        metadata.data.scholarship_id ?? null,
        metadata.data.title,
        metadata.data.document_type,
        uploaded.public_id,
        uploaded.secure_url,
        file.name,
        file.type,
        uploaded.bytes ?? file.size,
        metadata.data.source_url ?? null,
        metadata.data.academic_year ?? null,
        auth.user.id,
      ],
    );
    return NextResponse.json({ document: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Unable to upload and save document.", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Document upload failed.",
      },
      { status: 503 },
    );
  }
}
