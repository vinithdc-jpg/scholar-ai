import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ServiceAccount } from "firebase-admin";

const adminAppName = "scholar-ai-admin";

type ServiceAccountJson = ServiceAccount & {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function readServiceAccount(): ServiceAccountJson {
  const jsonFromEnvironment = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credentialPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  let credential: ServiceAccountJson;

  if (jsonFromEnvironment) {
    try {
      credential = JSON.parse(jsonFromEnvironment) as ServiceAccountJson;
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Set it to the complete Firebase service-account JSON.",
      );
    }
  } else if (credentialPath) {
    const absolutePath = resolve(
      /* turbopackIgnore: true */ process.cwd(),
      credentialPath,
    );
    let fileContents: string;

    try {
      fileContents = readFileSync(absolutePath, "utf8");
    } catch {
      throw new Error(
        `Unable to read the Firebase service-account file at "${absolutePath}". Check FIREBASE_SERVICE_ACCOUNT_PATH and ensure the file is deployed with the application.`,
      );
    }

    try {
      credential = JSON.parse(fileContents) as ServiceAccountJson;
    } catch {
      throw new Error(
        `The Firebase service-account file at "${absolutePath}" is not valid JSON.`,
      );
    }
  } else {
    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ??
      process.env.FIREBASE_PROJECT_ID ??
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail =
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL ??
      process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey =
      process.env.FIREBASE_ADMIN_PRIVATE_KEY ??
      process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase Admin credentials are missing. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON; alternatively set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
      );
    }

    credential = {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  const projectId = credential.project_id ?? credential.projectId;
  const clientEmail = credential.client_email ?? credential.clientEmail;
  const privateKey = credential.private_key ?? credential.privateKey;

  if (
    typeof projectId !== "string" ||
    !projectId.trim() ||
    typeof clientEmail !== "string" ||
    !clientEmail.trim() ||
    typeof privateKey !== "string" ||
    !privateKey.trim()
  ) {
    throw new Error(
      "Firebase service-account credentials must include project_id, client_email, and private_key.",
    );
  }

  return {
    ...credential,
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export function getFirebaseAdminAuth() {
  const existingApp = getApps().find((app) => app.name === adminAppName);
  if (existingApp) {
    return getAuth(existingApp);
  }

  const serviceAccount = readServiceAccount();
  const app = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    },
    adminAppName,
  );

  return getAuth(app);
}
