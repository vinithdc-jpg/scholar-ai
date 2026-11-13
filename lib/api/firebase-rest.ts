import { getServerEnv } from "@/lib/env";

type IdentityToolkitResponse = {
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  localId?: string;
  email?: string;
  error?: { message?: string };
};

export async function firebasePasswordAuth(
  mode: "signUp" | "signInWithPassword",
  email: string,
  password: string,
): Promise<IdentityToolkitResponse> {
  const apiKey = getServerEnv().NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Firebase client API key is not configured.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      cache: "no-store",
    },
  );

  const result = (await response.json()) as IdentityToolkitResponse;
  if (!response.ok) {
    const code = result.error?.message;
    const message =
      code === "EMAIL_EXISTS"
        ? "An account with this email already exists."
        : code === "INVALID_LOGIN_CREDENTIALS" ||
            code === "EMAIL_NOT_FOUND" ||
            code === "INVALID_PASSWORD"
          ? "The email or password is incorrect."
          : code === "WEAK_PASSWORD"
            ? "Choose a stronger password."
            : code === "OPERATION_NOT_ALLOWED"
              ? "Email/password sign-in is not enabled in Firebase."
              : "Firebase could not complete authentication.";
    throw new Error(message);
  }

  return result;
}
