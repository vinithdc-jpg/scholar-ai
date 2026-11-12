import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getDatabasePool } from "@/lib/db";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const idToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!idToken) {
    return NextResponse.json(
      { error: "A Firebase sign-in token is required." },
      { status: 401 },
    );
  }

  let firebaseAuth: ReturnType<typeof getFirebaseAdminAuth>;
  try {
    firebaseAuth = getFirebaseAdminAuth();
  } catch (error) {
    console.error(
      "Firebase Admin authentication could not be initialized.",
      error,
    );
    return NextResponse.json(
      { error: "Firebase Admin authentication is not configured on the server." },
      { status: 500 },
    );
  }

  let decodedToken;
  try {
    decodedToken = await firebaseAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json(
      { error: "Unable to verify your Firebase sign-in. Please sign in again." },
      { status: 401 },
    );
  }

  if (!decodedToken.email) {
    return NextResponse.json(
      { error: "Your Firebase account must have an email address." },
      { status: 400 },
    );
  }

  try {
    const result = await getDatabasePool().query(
      `INSERT INTO users (firebase_uid, full_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, firebase_uid, full_name, email, role, created_at, updated_at`,
      [
        decodedToken.uid,
        typeof decodedToken.name === "string" ? decodedToken.name : null,
        decodedToken.email,
      ],
    );

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Unable to save Firebase user profile to PostgreSQL.", error);
    return NextResponse.json(
      {
        error:
          "Unable to save your profile. Check the PostgreSQL connection and run npm run db:migrate.",
      },
      { status: 500 },
    );
  }
}
