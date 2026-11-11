import { z } from "zod";

const optionalValue = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  FIREBASE_SERVICE_ACCOUNT_PATH: optionalValue,
  FIREBASE_SERVICE_ACCOUNT_JSON: optionalValue,
  FIREBASE_ADMIN_PROJECT_ID: optionalValue,
  FIREBASE_ADMIN_CLIENT_EMAIL: optionalValue,
  FIREBASE_ADMIN_PRIVATE_KEY: optionalValue,
  FIREBASE_PROJECT_ID: optionalValue,
  FIREBASE_CLIENT_EMAIL: optionalValue,
  FIREBASE_PRIVATE_KEY: optionalValue,
  GROQ_API_KEY: optionalValue,
  GROQ_MODEL: optionalValue,
  EMBEDDING_PROVIDER: optionalValue,
  EMBEDDING_API_KEY: optionalValue,
  EMBEDDING_MODEL: optionalValue,
  EMBEDDING_DIMENSIONS: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().positive().optional(),
  ),
  CLOUDINARY_CLOUD_NAME: optionalValue,
  CLOUDINARY_API_KEY: optionalValue,
  CLOUDINARY_API_SECRET: optionalValue,
  REDIS_URL: optionalValue,
  NEXT_PUBLIC_FIREBASE_API_KEY: optionalValue,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: optionalValue,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: optionalValue,
  NEXT_PUBLIC_FIREBASE_APP_ID: optionalValue,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: optionalValue,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: optionalValue,
  NEXT_PUBLIC_APP_URL: optionalValue,
});

export function getServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const key = issue.path.join(".") || "environment";
        return `${key}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(`Invalid server environment configuration:\n${issues}`);
  }

  return result.data;
}
