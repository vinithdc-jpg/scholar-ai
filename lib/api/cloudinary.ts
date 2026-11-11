import { createHash } from "node:crypto";
import { getServerEnv } from "@/lib/env";

function config() {
  const env = getServerEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured.");
  }
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
}

function sign(parameters: Record<string, string>, secret: string) {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export async function uploadPdf(file: File) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const parameters = { timestamp };
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("signature", sign(parameters, apiSecret));
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/upload`,
    { method: "POST", body: form, cache: "no-store" },
  );
  const result = (await response.json()) as {
    public_id?: string;
    secure_url?: string;
    bytes?: number;
    format?: string;
    error?: { message?: string };
  };
  if (!response.ok || !result.public_id || !result.secure_url) {
    throw new Error(result.error?.message ?? "Cloudinary PDF upload failed.");
  }
  return result;
}

export async function deleteCloudinaryRaw(publicId: string) {
  const { cloudName, apiKey, apiSecret } = config();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const parameters = { public_id: publicId, timestamp };
  const form = new FormData();
  form.set("public_id", publicId);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("signature", sign(parameters, apiSecret));
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/destroy`,
    { method: "POST", body: form, cache: "no-store" },
  );
  const result = (await response.json()) as {
    result?: string;
    error?: { message?: string };
  };
  if (!response.ok || result.result !== "ok" && result.result !== "not found") {
    throw new Error(result.error?.message ?? "Cloudinary document deletion failed.");
  }
}
