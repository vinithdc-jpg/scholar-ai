import { NextResponse } from "next/server";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, getPagination } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";
import {
  createStorageSignedUrl,
  storageError,
} from "@/lib/supabase-storage";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const result = await getDatabasePool().query(
      `SELECT id, scholarship_id, title, document_type,
              storage_bucket, storage_path, original_filename, mime_type, file_size,
              page_count, source_url, academic_year, version,
              verification_status, processing_status, uploaded_by, created_at
       FROM scholarship_documents WHERE uploaded_by = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [auth.user.id, limit, offset],
    );
    try {
      const documents = await Promise.all(
        result.rows.map(async (row) => {
          const fileUrl =
            row.storage_bucket && row.storage_path
              ? await createStorageSignedUrl(
                  row.storage_bucket,
                  row.storage_path,
                )
              : null;
          const document = { ...row };
          delete document.storage_bucket;
          delete document.storage_path;
          return { ...document, file_url: fileUrl };
        }),
      );
      return NextResponse.json({
        documents,
        pagination: { page, limit },
      });
    } catch (error) {
      return storageError("Unable to create document links.", error);
    }
  } catch (error) {
    return databaseError("Unable to list documents.", error);
  }
}
