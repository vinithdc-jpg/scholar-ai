import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";
import {
  createStorageSignedUrl,
  removeStorageObject,
  storageError,
} from "@/lib/supabase-storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await context.params).id);
  if (!id.success)
    return NextResponse.json(
      { error: "Invalid document ID." },
      { status: 400 },
    );

  try {
    const result = await getDatabasePool().query(
      `SELECT id, scholarship_id, title, document_type,
              storage_bucket, storage_path, original_filename, mime_type, file_size,
              page_count, source_url, academic_year, version,
              verification_status, processing_status, uploaded_by, created_at
       FROM scholarship_documents WHERE id = $1 AND uploaded_by = $2`,
      [id.data, auth.user.id],
    );
    if (!result.rowCount)
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    const row = result.rows[0];
    try {
      const fileUrl =
        row.storage_bucket && row.storage_path
          ? await createStorageSignedUrl(row.storage_bucket, row.storage_path)
          : null;
      const document = { ...row };
      delete document.storage_bucket;
      delete document.storage_path;
      return NextResponse.json({
        document: { ...document, file_url: fileUrl },
      });
    } catch (error) {
      return storageError("Unable to create a document link.", error);
    }
  } catch (error) {
    return databaseError("Unable to load document.", error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const id = z.coerce
    .number()
    .int()
    .positive()
    .safeParse((await context.params).id);
  if (!id.success) {
    return NextResponse.json(
      { error: "Invalid document ID." },
      { status: 400 },
    );
  }

  try {
    const pool = getDatabasePool();
    const result = await pool.query(
      `SELECT storage_bucket, storage_path
       FROM scholarship_documents WHERE id = $1 AND uploaded_by = $2`,
      [id.data, auth.user.id],
    );
    if (!result.rowCount) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    }

    const { storage_bucket: bucket, storage_path: path } = result.rows[0];
    if (bucket && path) {
      try {
        await removeStorageObject(bucket, path);
      } catch (error) {
        return storageError("Unable to delete the stored document.", error);
      }
    }

    const deleted = await pool.query(
      "DELETE FROM scholarship_documents WHERE id = $1 AND uploaded_by = $2",
      [id.data, auth.user.id],
    );
    if (!deleted.rowCount) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return databaseError("Unable to delete document metadata.", error);
  }
}
