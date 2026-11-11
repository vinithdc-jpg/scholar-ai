import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { getServerEnv } from "../lib/env";

loadEnvConfig(process.cwd());

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
