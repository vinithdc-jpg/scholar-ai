import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson } from "@/lib/api/http";
import { firebasePasswordAuth } from "@/lib/api/firebase-rest";
import { getDatabasePool } from "@/lib/db";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  name: z.string().trim().min(1).max(255),
});

export async function POST(request: Request) {
  const parsed = await readJson(request, schema);
  if (parsed.response) return parsed.response;

  let createdUid: string | undefined;
  try {
    const authResult = await firebasePasswordAuth(
      "signUp",
      parsed.data.email,
      parsed.data.password,
    );
    if (!authResult.idToken || !authResult.localId) {
      throw new Error("Firebase did not return a complete account result.");
    }
    createdUid = authResult.localId;

    try {
      await getFirebaseAdminAuth().updateUser(createdUid, {
        displayName: parsed.data.name,
      });
    } catch (error) {
      console.error("Firebase could not save the account display name.", error);
      throw new Error(
        "Firebase could not save the account display name. Check Firebase Admin credentials and permissions.",
      );
    }

    const namedAuthResult = await firebasePasswordAuth(
      "signInWithPassword",
      parsed.data.email,
      parsed.data.password,
    );
    if (
      !namedAuthResult.idToken ||
      namedAuthResult.localId !== createdUid ||
      !namedAuthResult.email
    ) {
      throw new Error(
        "Firebase did not return a complete sign-in result after registration.",
      );
    }

    let profile;
    try {
      profile = await getDatabasePool().query(
        `INSERT INTO users (firebase_uid, full_name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (firebase_uid)
         DO UPDATE SET full_name = EXCLUDED.full_name,
                       email = EXCLUDED.email,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING id, firebase_uid, full_name, email, role, created_at, updated_at`,
        [namedAuthResult.localId, parsed.data.name, namedAuthResult.email],
      );
    } catch (error) {
      console.error(
        "Unable to persist profile after Firebase registration.",
        error,
      );
      try {
        await getFirebaseAdminAuth().deleteUser(namedAuthResult.localId);
        createdUid = undefined;
      } catch {
        console.error(
          "Unable to roll back Firebase account after profile save failure.",
        );
      }
      return NextResponse.json(
        {
          error:
            "Account was created but its profile could not be saved. Check database setup and try again.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        user: profile.rows[0],
        idToken: namedAuthResult.idToken,
        refreshToken: namedAuthResult.refreshToken,
        expiresIn: namedAuthResult.expiresIn,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed.";
    if (createdUid) {
      try {
        await getFirebaseAdminAuth().deleteUser(createdUid);
      } catch {
        console.error("Unable to roll back incomplete Firebase registration.");
      }
    }
    const status = message.includes("already exists")
      ? 409
      : message.includes("not configured") ||
          message.includes("Firebase Admin credentials and permissions")
        ? 503
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
