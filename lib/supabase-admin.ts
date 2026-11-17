import { createClient } from "@supabase/supabase-js";

export class SupabaseAdminConfigurationError extends Error {
  constructor() {
    super(
      "Use SUPABASE_SECRET_KEY (sb_secret_...) or a legacy service_role JWT.",
    );
    this.name = "SupabaseAdminConfigurationError";
  }
}

function isLegacyServiceRoleJwt(value: string) {
  const [header, payload, signature, extra] = value.split(".");
  if (!header || !payload || !signature || extra !== undefined) return false;
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { role?: unknown };
    return claims.role === "service_role";
  } catch {
    return false;
  }
}

export function createSupabaseAdminClient(
  supabaseUrl: string,
  apiKey: string,
  fetchImplementation: typeof fetch = globalThis.fetch,
) {
  const isSecretKey = apiKey.startsWith("sb_secret_");
  if (!isSecretKey && !isLegacyServiceRoleJwt(apiKey)) {
    throw new SupabaseAdminConfigurationError();
  }

  const fetchWithoutSecretBearer: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers);
    headers.delete("Authorization");
    return fetchImplementation(input, { ...init, headers });
  };

  return createClient(supabaseUrl, apiKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: isSecretKey ? fetchWithoutSecretBearer : fetchImplementation,
    },
  });
}
