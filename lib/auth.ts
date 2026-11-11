import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";

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
  const result = await signInWithEmailAndPassword(auth, email, password);

  return result.user;
};

// Google Login
export const googleLogin = async () => {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);

  return result.user;
};

// Logout
export const logoutUser = async () => {
  await signOut(auth);
};

export const syncUserProfile = async (user: User) => {
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
  };

  if (!response.ok) {
    throw new Error(result.error ?? "Unable to save your account profile.");
  }
};
