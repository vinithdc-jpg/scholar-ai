import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { z } from "zod";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { isResponse, requireRoles } from "@/lib/api/auth";
import { databaseError, readJson } from "@/lib/api/http";
import { getDatabasePool } from "@/lib/db";
import { getSuperAdminEmail } from "@/lib/super-admin";

const createAdminSchema = z.object({
  email: z.string().trim().email().max(255),
  full_name: z.string().trim().min(1).max(255),
  password: z.string().min(12).max(128),
});

export async function GET(request: Request) {
  const auth = await requireRoles(request, ["super_admin"]);
  if (isResponse(auth)) return auth.response;

  try {
    const result = await getDatabasePool().query(
      `SELECT id, email, full_name, role, created_at
       FROM users
       WHERE role IN ('content_admin', 'super_admin')
       ORDER BY role, full_name, email`,
    );
    return NextResponse.json({ admins: result.rows });
  } catch (error) {
    return databaseError("Unable to list admin accounts.", error);
  }
}

export async function POST(request: Request) {
  const auth = await requireRoles(request, ["super_admin"]);
  if (isResponse(auth)) return auth.response;

  const parsed = await readJson(request, createAdminSchema);
  if (parsed.response) return parsed.response;

  if (parsed.data.email.toLowerCase() === getSuperAdminEmail()) {
    return NextResponse.json(
      { error: "The configured super-admin account cannot be changed here." },
      { status: 409 },
    );
  }

  let firebaseAuth: ReturnType<typeof getFirebaseAdminAuth>;
  try {
    firebaseAuth = getFirebaseAdminAuth();
  } catch (error) {
    console.error("Firebase Admin authentication could not be initialized.", error);
    return NextResponse.json(
      { error: "Firebase Admin authentication is not configured on the server." },
      { status: 503 },
    );
  }

  let firebaseUser;
  try {
    firebaseUser = await firebaseAuth.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.full_name,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "auth/email-already-exists"
    ) {
      return NextResponse.json(
        { error: "A Firebase account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Unable to create the Firebase admin account.", error);
    return NextResponse.json(
      { error: "Unable to create the Firebase admin account." },
      { status: 503 },
    );
  }

  let client: PoolClient | undefined;
  try {
    client = await getDatabasePool().connect();
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO users (firebase_uid, full_name, email, role)
       VALUES ($1, $2, $3, 'content_admin')
       RETURNING id, firebase_uid, full_name, email, role, created_at`,
      [
        firebaseUser.uid,
        parsed.data.full_name,
        parsed.data.email.toLowerCase(),
      ],
    );

    await client.query(
      `INSERT INTO admin_audit_logs
         (admin_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'admin_access_granted', 'user', $2, $3)`,
      [
        auth.user.id,
        firebaseUser.uid,
        JSON.stringify({
          email: parsed.data.email,
          role: "content_admin",
        }),
      ],
    );
    await client.query("COMMIT");

    return NextResponse.json({ admin: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Unable to roll back admin account creation.", rollbackError);
      }
    }
    try {
      await firebaseAuth.deleteUser(firebaseUser.uid);
    } catch (rollbackError) {
      console.error(
        "Unable to remove the Firebase account after admin creation failed.",
        rollbackError,
      );
    }
    console.error("Unable to grant admin access.", error);
    return NextResponse.json(
      { error: "Unable to save the admin account." },
      { status: 503 },
    );
  } finally {
    client?.release();
  }
}
