import {
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  updateProfile,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";

export type AppRole = "student" | "content_admin";

function isAppRole(role: unknown): role is AppRole {
  return (
    role === "student" || role === "content_admin"
  );
}

async function readAppRole(response: Response): Promise<AppRole> {
  const result = (await response.json()) as {
    error?: string;
    user?: { role?: string };
  };

  if (!response.ok) {
    throw new Error(result.error ?? "Unable to load your account role.");
  }
  if (!isAppRole(result.user?.role)) {
    throw new Error("Unable to determine your account role.");
  }

  return result.user.role;
}

// Register
export const registerUser = async (
  email: string,
  password: string,
  name: string,
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name.trim() });
  await result.user.getIdToken(true);

  return result.user;
};

// Login
export const loginUser = async (email: string, password: string) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const result = (await response.json()) as {
    error?: string;
    customToken?: string;
  };

  if (!response.ok) {
    throw new Error(result.error ?? "Unable to sign in.");
  }
  if (!result.customToken) {
    throw new Error("Firebase did not return a sign-in token.");
  }

  const signInResult = await signInWithCustomToken(auth, result.customToken);
  return signInResult.user;
};

// Google Login
export const googleLogin = async () => {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);

  return result.user;
};

// Logout
export const logoutUser = async () => {
  let revocationError: unknown;
  const user = auth.currentUser;

  if (user) {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          result?.error ?? "Unable to revoke your Firebase session.",
        );
      }
    } catch (error) {
      revocationError = error;
    }
  }

  await signOut(auth);

  if (revocationError) {
    throw revocationError instanceof Error
      ? revocationError
      : new Error("Unable to revoke your Firebase session.");
  }
};

export const syncUserProfile = async (
  user: User,
): Promise<{ role: AppRole }> => {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/users/me", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  return { role: await readAppRole(response) };
};

export async function getUserRole(user: User): Promise<AppRole> {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });

  return readAppRole(response);
}
