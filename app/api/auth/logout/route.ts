import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json(
      { error: "A Firebase sign-in token is required." },
      { status: 401 },
    );
  }

  let adminAuth: ReturnType<typeof getFirebaseAdminAuth>;
  try {
    adminAuth = getFirebaseAdminAuth();
  } catch (error) {
    console.error("Firebase Admin authentication could not be initialized.", error);
    return NextResponse.json(
      { error: "Firebase Admin authentication is not configured on the server." },
      { status: 503 },
    );
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json(
      {
        error: "Unable to verify your Firebase sign-in. Please sign in again.",
      },
      { status: 401 },
    );
  }

  try {
    await adminAuth.revokeRefreshTokens(decoded.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unable to revoke Firebase refresh tokens.", error);
    return NextResponse.json(
      {
        error: "Unable to revoke your Firebase session.",
      },
      { status: 503 },
    );
  }
}
