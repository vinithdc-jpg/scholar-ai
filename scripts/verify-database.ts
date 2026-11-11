import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { getServerEnv } from "../lib/env";

loadEnvConfig(process.cwd());

async function verifyDatabase() {
  const { DATABASE_URL } = getServerEnv();
  const pool = new Pool({
    connectionString: DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

  try {
    const result = await pool.query(`
      SELECT
        EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) AS pgvector_enabled,
        EXISTS (
          SELECT 1 FROM pg_available_extensions WHERE name = 'vector'
        ) AS pgvector_available,
        to_regclass('public.users') IS NOT NULL AS users_table_exists,
        to_regclass('public.schema_migrations') IS NOT NULL AS migrations_table_exists
    `);
    const status = result.rows[0] as {
      pgvector_enabled: boolean;
      pgvector_available: boolean;
      users_table_exists: boolean;
      migrations_table_exists: boolean;
    };
    const migration = status.migrations_table_exists
      ? await pool.query(
          "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE name = $1) AS applied",
          ["0001_initial_schema.sql"],
        )
      : { rows: [{ applied: false }] };
    const initialMigrationApplied = migration.rows[0].applied as boolean;

    console.info("PostgreSQL connection: available");
    console.info(
      `pgvector extension: ${
        status.pgvector_enabled
          ? "enabled"
          : status.pgvector_available
            ? "available but not enabled"
            : "not installed on server"
      }`,
    );
    console.info(`users table: ${status.users_table_exists ? "present" : "missing"}`);
    console.info(
      `migration tracking: ${status.migrations_table_exists ? "present" : "missing"}`,
    );
    console.info(
      `initial schema migration: ${initialMigrationApplied ? "applied" : "pending"}`,
    );

    if (
      !status.pgvector_enabled ||
      !status.users_table_exists ||
      !status.migrations_table_exists ||
      !initialMigrationApplied
    ) {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

verifyDatabase().catch((error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? ` (${String(error.code)})`
      : "";
  console.error(`Database verification failed${code}. Check DATABASE_URL and database availability.`);
  process.exitCode = 1;
});
