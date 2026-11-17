import "server-only";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import {
  createSupabaseAdminClient,
  SupabaseAdminConfigurationError,
} from "@/lib/supabase-admin";

export const SCHOLARSHIP_DOCUMENTS_BUCKET = "scholarship-documents";
export const SIGNED_URL_EXPIRY_SECONDS = 300;

let storageClient: ReturnType<typeof createSupabaseAdminClient> | undefined;

export class StorageConfigurationError extends Error {
  constructor(message = "Supabase Storage is not configured.") {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

function getStorageClient() {
  if (storageClient) return storageClient;

  const {
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
  } = getServerEnv();
  const supabaseUrl = SUPABASE_URL || NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !apiKey) {
    throw new StorageConfigurationError(
      "Set SUPABASE_URL and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY) on the server.",
    );
  }

  try {
    storageClient = createSupabaseAdminClient(supabaseUrl, apiKey);
  } catch (error) {
    if (error instanceof SupabaseAdminConfigurationError) {
      throw new StorageConfigurationError(error.message);
    }
    throw error;
  }

  return storageClient;
}

function assertStorageBucket(bucket: string) {
  if (bucket !== SCHOLARSHIP_DOCUMENTS_BUCKET) {
    throw new Error("The requested storage bucket is not permitted.");
  }
}

export async function uploadPdfToStorage(
  path: string,
  file: File,
): Promise<void> {
  const { error } = await getStorageClient()
    .storage.from(SCHOLARSHIP_DOCUMENTS_BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;
}

export async function createStorageSignedUrl(
  bucket: string,
  path: string,
): Promise<string> {
  assertStorageBucket(bucket);
  const { data, error } = await getStorageClient()
    .storage.from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

  if (error) throw error;
  if (!data?.signedUrl) {
    throw new Error("Supabase Storage did not return a signed URL.");
  }

  return data.signedUrl;
}

export async function removeStorageObject(
  bucket: string,
  path: string,
): Promise<void> {
  assertStorageBucket(bucket);
  const { error } = await getStorageClient().storage.from(bucket).remove([path]);
  if (error) throw error;
}

type ScholarshipDocumentPath = {
  document_storage_bucket: string | null;
  document_storage_path: string | null;
};

export async function addScholarshipDocumentUrls<
  T extends ScholarshipDocumentPath,
>(records: T[]) {
  return Promise.all(
    records.map(async (record) => {
      const {
        document_storage_bucket: bucket,
        document_storage_path: path,
        ...scholarship
      } = record;

      return {
        ...scholarship,
        document_url:
          bucket && path ? await createStorageSignedUrl(bucket, path) : null,
      };
    }),
  );
}

export function storageError(message: string, error: unknown) {
  console.error(message, error);
  const configurationError = error instanceof StorageConfigurationError;
  const invalidCredentials =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    /Invalid Compact JWS/i.test(error.message);
  return NextResponse.json(
    {
      error: configurationError
        ? error.message
        : invalidCredentials
          ? "Supabase Storage rejected its credentials. Check that SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY belongs to the configured Supabase project."
          : "A file storage operation failed. Please try again.",
    },
    { status: configurationError || invalidCredentials ? 503 : 502 },
  );
}
