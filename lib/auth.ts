import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";

// Register
export const registerUser = async (
  email: string,
  password: string,
  name: string,
) => {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
    cache: "no-store",
  });
  const result = (await response.json()) as {
    error?: string;
    customToken?: string;
  };
  if (!response.ok) {
    throw new Error(result.error ?? "Unable to create your account.");
  }
  if (!result.customToken) {
    throw new Error("Firebase did not return a sign-in token.");
  }

  return (await signInWithCustomToken(auth, result.customToken)).user;
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
): Promise<void> => {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/users/me", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    cache: "no-store",
  });
  const result = (await response.json()) as {
    error?: string;
    user?: { id?: number };
  };
  if (!response.ok) {
    throw new Error(result.error ?? "Unable to save your profile.");
  }
  if (!result.user) {
    throw new Error("The profile response is invalid.");
  }
}
