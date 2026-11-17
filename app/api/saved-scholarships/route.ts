import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, isResponse } from "@/lib/api/auth";
import { databaseError, getPagination, readJson } from "@/lib/api/http";
import { scholarshipFields } from "@/lib/api/scholarships";
import { getDatabasePool } from "@/lib/db";
import {
  addScholarshipDocumentUrls,
  storageError,
} from "@/lib/supabase-storage";

const schema = z.object({ scholarship_id: z.number().int().positive() });

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const { page, limit, offset } = getPagination(new URL(request.url));

  try {
    const result = await getDatabasePool().query(
      `SELECT ss.id AS saved_id, ss.created_at AS saved_at,
              s.id, ${scholarshipFields.map((field) => `s.${field}`).join(", ")},
              (SELECT d.storage_bucket FROM scholarship_documents d
               WHERE d.scholarship_id = s.id AND d.storage_path IS NOT NULL
               ORDER BY d.created_at DESC LIMIT 1) AS document_storage_bucket,
              (SELECT d.storage_path FROM scholarship_documents d
               WHERE d.scholarship_id = s.id AND d.storage_path IS NOT NULL
               ORDER BY d.created_at DESC LIMIT 1) AS document_storage_path
       FROM saved_scholarships ss
       JOIN scholarships s ON s.id = ss.scholarship_id
       WHERE ss.user_id = $1
       ORDER BY ss.created_at DESC LIMIT $2 OFFSET $3`,
      [auth.user.id, limit, offset],
    );
    try {
      const scholarships = await addScholarshipDocumentUrls(result.rows);
      return NextResponse.json({
        scholarships,
        pagination: { page, limit },
      });
    } catch (error) {
      return storageError("Unable to create scholarship document links.", error);
    }
  } catch (error) {
    return databaseError("Unable to load saved scholarships.", error);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (isResponse(auth)) return auth.response;
  const parsed = await readJson(request, schema);
  if (parsed.response) return parsed.response;

  try {
    const result = await getDatabasePool().query(
      `INSERT INTO saved_scholarships (user_id, scholarship_id)
       SELECT $1, id FROM scholarships
       WHERE id = $2 AND status = 'published'
         AND (verification_status = 'verified'
           OR (submitted_by IS NOT NULL AND verification_status = 'pending'))
       ON CONFLICT (user_id, scholarship_id) DO NOTHING
       RETURNING id, user_id, scholarship_id, created_at`,
      [auth.user.id, parsed.data.scholarship_id],
    );
    if (!result.rowCount) {
      const exists = await getDatabasePool().query(
        "SELECT id, user_id, scholarship_id, created_at FROM saved_scholarships WHERE user_id = $1 AND scholarship_id = $2",
        [auth.user.id, parsed.data.scholarship_id],
      );
      if (!exists.rowCount) {
        return NextResponse.json(
          { error: "Published scholarship not found." },
          { status: 404 },
        );
      }
      return NextResponse.json({ savedScholarship: exists.rows[0] });
    }
    return NextResponse.json(
      { savedScholarship: result.rows[0] },
      { status: 201 },
    );
  } catch (error) {
    return databaseError("Unable to save scholarship.", error);
  }
}
