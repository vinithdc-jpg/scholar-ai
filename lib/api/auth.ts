import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getDatabasePool } from "@/lib/db";

export type AppRole = "student" | "content_admin" | "super_admin";

export type ApiUser = {
  id: string;
  firebase_uid: string;
  email: string;
  full_name: string | null;
  role: AppRole;
};

type AuthResult =
  | { user: ApiUser; response?: never }
  | { user?: never; response: NextResponse };

export async function authenticateRequest(
  request: Request,
): Promise<AuthResult> {
  const authorization = request.headers.get("authorization");
  const idToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!idToken) {
    return {
      response: NextResponse.json(
        { error: "A Firebase sign-in token is required." },
        { status: 401 },
      ),
    };
  }

  let firebaseAuth;
  try {
    firebaseAuth = getFirebaseAdminAuth();
  } catch (error) {
    console.error(
      "Firebase Admin authentication could not be initialized.",
      error,
    );
    return {
      response: NextResponse.json(
        {
          error:
            "Firebase Admin authentication is not configured on the server.",
        },
        { status: 500 },
      ),
    };
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(idToken, true);
  } catch {
    return {
      response: NextResponse.json(
        {
          error:
            "Unable to verify your Firebase sign-in. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  if (!decodedToken.email) {
    return {
      response: NextResponse.json(
        { error: "Your Firebase account must have an email address." },
        { status: 400 },
      ),
    };
  }

  try {
    const profile = await getDatabasePool().query<ApiUser>(
      `INSERT INTO users (firebase_uid, full_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET
         full_name = COALESCE(EXCLUDED.full_name, users.full_name),
         email = EXCLUDED.email,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, firebase_uid, full_name, email, role`,
      [
        decodedToken.uid,
        typeof decodedToken.name === "string" ? decodedToken.name : null,
        decodedToken.email,
      ],
    );

    return { user: profile.rows[0] };
  } catch (error) {
    console.error("Unable to load authenticated user profile.", error);
    return {
      response: NextResponse.json(
        {
          error:
            "Unable to load your profile. Check database setup and connectivity.",
        },
        { status: 503 },
      ),
    };
  }
}

export async function requireRoles(
  request: Request,
  allowedRoles: readonly AppRole[],
): Promise<AuthResult> {
  const result = await authenticateRequest(request);
  if (result.response) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return {
      response: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 },
      ),
    };
  }

  return result;
}

export function isResponse(
  result: AuthResult,
): result is { response: NextResponse; user?: never } {
  return Boolean(result.response);
}
