import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { Pool, type PoolClient } from "pg";
import { getServerEnv } from "../lib/env";
import { createSupabaseAdminClient } from "../lib/supabase-admin";

loadEnvConfig(process.cwd());

const STORAGE_BUCKET = "scholarship-documents";
const MAX_PDF_SIZE = 500 * 1024;

async function columnExists(
  client: PoolClient,
  table: string,
  column: string,
) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = $1 AND column_name = $2
     ) AS exists`,
    [table, column],
  );
  return result.rows[0].exists as boolean;
}

async function downloadLegacyPdf(url: string) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("A legacy document has an invalid URL.");
  }
  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "res.cloudinary.com"
  ) {
    throw new Error("A legacy document URL is not an allowed HTTPS file URL.");
  }

  const response = await fetch(parsedUrl, { redirect: "error" });
  if (!response.ok) {
    throw new Error(
      `A legacy document could not be downloaded (HTTP ${response.status}).`,
    );
  }
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_PDF_SIZE) {
    throw new Error("A legacy document exceeds the 500 KB storage limit.");
  }

  if (!response.body) {
    throw new Error("A legacy document response did not contain a file.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.byteLength;
    if (totalSize > MAX_PDF_SIZE) {
      await reader.cancel();
      throw new Error("A legacy document exceeds the 500 KB storage limit.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (
    bytes.length < 5 ||
    new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-"
  ) {
    throw new Error("A legacy document is not a valid PDF.");
  }
  return bytes;
}

async function migrateLegacyStorage(client: import("pg").PoolClient) {
  const hasLegacyDocumentUrls = await columnExists(
    client,
    "scholarship_documents",
    "cloudinary_secure_url",
  );
  const hasScholarshipDocumentUrl = await columnExists(
    client,
    "scholarships",
    "document_url",
  );
  if (!hasLegacyDocumentUrls && !hasScholarshipDocumentUrl) return;

  await client.query(`
    ALTER TABLE scholarship_documents
      ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT '${STORAGE_BUCKET}',
      ADD COLUMN IF NOT EXISTS storage_path TEXT
  `);
  await client.query(`
    UPDATE scholarship_documents
    SET storage_bucket = '${STORAGE_BUCKET}'
    WHERE storage_bucket IS NULL
  `);

  const legacyDocuments: { id: string; cloudinary_secure_url: string }[] =
    hasLegacyDocumentUrls
      ? (
          await client.query(
        `SELECT id, cloudinary_secure_url
         FROM scholarship_documents
         WHERE cloudinary_secure_url IS NOT NULL AND storage_path IS NULL`,
          )
        ).rows
      : [];
  const legacyScholarships: {
    id: string;
    name: string;
    document_url: string;
    official_source_url: string | null;
    academic_year: string | null;
    submitted_by: string | null;
  }[] = hasScholarshipDocumentUrl
    ? (
        await client.query(
        `SELECT id, name, document_url, official_source_url,
                academic_year, submitted_by
         FROM scholarships WHERE document_url IS NOT NULL`,
        )
      ).rows
    : [];
  if (!legacyDocuments.length && !legacyScholarships.length) return;

  const {
    SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
  } = getServerEnv();
  const supabaseUrl = SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !apiKey) {
    throw new Error(
      "Legacy files exist. Set a Supabase URL and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY) before migrating.",
    );
  }

  const storage = createSupabaseAdminClient(supabaseUrl, apiKey).storage;
  const bucketOptions = {
    public: false,
    fileSizeLimit: MAX_PDF_SIZE,
    allowedMimeTypes: ["application/pdf"],
  };
  const { data: existingBucket, error: bucketLookupError } =
    await storage.getBucket(STORAGE_BUCKET);
  if (bucketLookupError) {
    const { error } = await storage.createBucket(
      STORAGE_BUCKET,
      bucketOptions,
    );
    if (error) throw error;
  } else if (existingBucket) {
    const { error } = await storage.updateBucket(
      STORAGE_BUCKET,
      bucketOptions,
    );
    if (error) throw error;
  } else {
    const { error } = await storage.createBucket(
      STORAGE_BUCKET,
      bucketOptions,
    );
    if (error) throw error;
  }

  async function uploadLegacyFile(url: string) {
    const bytes = await downloadLegacyPdf(url);
    const path = `legacy/${randomUUID()}.pdf`;
    const { error } = await storage.from(STORAGE_BUCKET).upload(path, bytes, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return { path, size: bytes.length };
  }

  for (const document of legacyDocuments) {
    const { path } = await uploadLegacyFile(document.cloudinary_secure_url);
    try {
      await client.query(
        `UPDATE scholarship_documents
         SET storage_bucket = $2, storage_path = $3 WHERE id = $1`,
        [document.id, STORAGE_BUCKET, path],
      );
    } catch (error) {
      const { error: cleanupError } = await storage
        .from(STORAGE_BUCKET)
        .remove([path]);
      if (cleanupError) {
        console.error("Unable to clean up an unlinked legacy file.", cleanupError);
      }
      throw error;
    }
  }

  for (const scholarship of legacyScholarships) {
    const matchingDocument = hasLegacyDocumentUrls
      ? await client.query(
          `SELECT id FROM scholarship_documents
           WHERE scholarship_id = $1 AND cloudinary_secure_url = $2
             AND storage_path IS NOT NULL`,
          [scholarship.id, scholarship.document_url],
        )
      : { rowCount: 0 };
    if (matchingDocument.rowCount) {
      await client.query(
        "UPDATE scholarships SET document_url = NULL WHERE id = $1",
        [scholarship.id],
      );
      continue;
    }

    const { path, size } = await uploadLegacyFile(scholarship.document_url);
    let transactionStarted = false;
    try {
      await client.query("BEGIN");
      transactionStarted = true;
      await client.query(
        `INSERT INTO scholarship_documents (
           scholarship_id, title, document_type, storage_bucket, storage_path,
           original_filename, mime_type, file_size, source_url, academic_year,
           uploaded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          scholarship.id,
          scholarship.name,
          "Scholarship details",
          STORAGE_BUCKET,
          path,
          "scholarship-details.pdf",
          "application/pdf",
          size,
          scholarship.official_source_url,
          scholarship.academic_year,
          scholarship.submitted_by,
        ],
      );
      await client.query(
        "UPDATE scholarships SET document_url = NULL WHERE id = $1",
        [scholarship.id],
      );
      await client.query("COMMIT");
      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Unable to roll back legacy file metadata.", rollbackError);
        }
      }
      const { error: cleanupError } = await storage
        .from(STORAGE_BUCKET)
        .remove([path]);
      if (cleanupError) {
        console.error("Unable to clean up an unlinked legacy file.", cleanupError);
      }
      throw error;
    }
  }
}

async function migrate() {
  const { DATABASE_URL } = getServerEnv();
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock(hashtext($1)::bigint)", [
      "scholar-ai-schema-migrations",
    ]);
    const extension = await client.query(
      "SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') AS available",
    );

    if (!extension.rows[0].available) {
      throw new Error(
        "This PostgreSQL server does not provide pgvector. Use a pgvector-enabled database or ask the database provider to install the vector extension.",
      );
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDirectory = join(process.cwd(), "db", "migrations");
    const files = (await readdir(migrationsDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [file],
      );

      if (alreadyApplied.rowCount) {
        console.info(`Already applied: ${file}`);
        continue;
      }

      if (file === "0005_supabase_storage.sql") {
        await migrateLegacyStorage(client);
      }

      const sql = await readFile(join(migrationsDirectory, file), "utf8");
      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.info(`Applied: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext($1)::bigint)", [
      "scholar-ai-schema-migrations",
    ]);
    client.release();
    await pool.end();
  }
}

migrate().catch((error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? ` (${String(error.code)})`
      : "";
  console.error(
    `${error instanceof Error ? error.message : "Database migration failed."}${code}`,
  );
  process.exitCode = 1;
});
