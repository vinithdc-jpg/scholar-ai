"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type ApiError = { error?: string };

function getCurrentUser(): Promise<User> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error("Sign in to continue."));
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      },
    );
  });
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const user = await getCurrentUser();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    if (response.ok) {
      throw new Error("The server returned an invalid response.");
    }
    result = null;
  }

  if (!response.ok) {
    const error =
      typeof result === "object" && result !== null
        ? (result as ApiError).error
        : undefined;
    throw new Error(error ?? `Request failed (${response.status}).`);
  }

  return result as T;
}
