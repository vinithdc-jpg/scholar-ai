import { Pool } from "pg";
import { getServerEnv } from "./env";

declare global {
  var postgresPool: Pool | undefined;
}

export function getDatabasePool() {
  const { DATABASE_URL } = getServerEnv();
  globalThis.postgresPool ??= new Pool({ connectionString: DATABASE_URL });
  return globalThis.postgresPool;
}
