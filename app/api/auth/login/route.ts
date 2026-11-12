import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/api/http";
import { firebasePasswordAuth } from "@/lib/api/firebase-rest";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getDatabasePool } from "@/lib/db";

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const parsed = await readJson(request, schema);
  if (parsed.response) return parsed.response;

  try {
    const result = await firebasePasswordAuth(
      "signInWithPassword",
      parsed.data.email,
      parsed.data.password,
    );
    if (!result.idToken)
      throw new Error("Firebase did not return an ID token.");

    const decoded = await getFirebaseAdminAuth().verifyIdToken(result.idToken);
    if (!decoded.email) {
      return NextResponse.json(
        { error: "Your Firebase account must have an email address." },
        { status: 400 },
      );
    }

    const profile = await getDatabasePool().query(
      `INSERT INTO users (firebase_uid, full_name, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET full_name = COALESCE(EXCLUDED.full_name, users.full_name),
                     email = EXCLUDED.email,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING id, firebase_uid, full_name, email, role, created_at, updated_at`,
      [
        decoded.uid,
        typeof decoded.name === "string" ? decoded.name : null,
        decoded.email,
      ],
    );

    return NextResponse.json({
      user: profile.rows[0],
      idToken: result.idToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to sign in.",
      },
      {
        status:
          error instanceof Error && error.message.includes("incorrect")
            ? 401
            : 503,
      },
    );
  }
}
