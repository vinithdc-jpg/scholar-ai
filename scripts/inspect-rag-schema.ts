import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";

loadEnvConfig(process.cwd());

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const embeddingType = await pool.query(
      `SELECT format_type(atttypid, atttypmod) AS type
       FROM pg_attribute
       WHERE attrelid = 'document_chunks'::regclass AND attname = 'embedding'`,
    );
    const leftover = await pool.query(
      `SELECT count(*)::int AS users FROM users WHERE firebase_uid LIKE 'rag-test-%'`,
    );
    const indexes = await pool.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'document_chunks'`,
    );
    console.log({
      embeddingType: embeddingType.rows[0],
      leftoverTestUsers: leftover.rows[0],
      indexes: indexes.rows,
    });
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
