import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError } from "@/lib/api/http";
import { scholarshipFields } from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";
import {
  addScholarshipDocumentUrls,
  storageError,
} from "@/lib/supabase-storage";

type RouteContext = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();

export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { id: rawId } = await context.params;
  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return NextResponse.json(
      { error: "Invalid scholarship ID." },
      { status: 400 },
    );
  }

  try {
    const result = await getDatabasePool().query(
      `SELECT s.id, ${scholarshipFields.map((field) => `s.${field}`).join(", ")},
         s.submitted_by IS NOT NULL AND s.verification_status = 'pending' AS is_community_submitted,
         (SELECT d.storage_bucket FROM scholarship_documents d
          WHERE d.scholarship_id = s.id AND d.storage_path IS NOT NULL
          ORDER BY d.created_at DESC LIMIT 1) AS document_storage_bucket,
         (SELECT d.storage_path FROM scholarship_documents d
          WHERE d.scholarship_id = s.id AND d.storage_path IS NOT NULL
          ORDER BY d.created_at DESC LIMIT 1) AS document_storage_path
       FROM scholarships s WHERE s.id = $1
       AND s.status = 'published'
       AND (s.verification_status = 'verified'
         OR (s.submitted_by IS NOT NULL AND s.verification_status = 'pending'))`,
      [id.data],
    );
    if (!result.rowCount) {
      return NextResponse.json(
        { error: "Scholarship not found." },
        { status: 404 },
      );
    }
    try {
      const [scholarship] = await addScholarshipDocumentUrls(result.rows);
      return NextResponse.json({ scholarship });
    } catch (error) {
      return storageError("Unable to create a scholarship document link.", error);
    }
  } catch (error) {
    return databaseError("Unable to load scholarship.", error);
  }
}
