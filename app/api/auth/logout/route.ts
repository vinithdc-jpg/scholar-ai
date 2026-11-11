import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return NextResponse.json(
      { error: "A Firebase sign-in token is required." },
      { status: 401 },
    );
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    await adminAuth.revokeRefreshTokens(decoded.uid);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to verify your Firebase sign-in. Please sign in again." },
      { status: 401 },
    );
  }
}
