"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { FirebaseError } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import {
  googleLogin,
  loginUser,
  logoutUser,
  registerUser,
  syncUserProfile,
} from "@/lib/auth";

type AuthMode = "sign-in" | "sign-up";

function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in instead.";
      case "auth/invalid-credential":
        return "The email or password is incorrect.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Enable it in the Firebase Console.";
      case "auth/popup-closed-by-user":
        return "The Google sign-in window was closed before finishing.";
      case "auth/weak-password":
        return "Choose a stronger password with at least 6 characters.";
      default:
        return error.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const initialAuthState = useRef(true);

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setIsCheckingAuth(false);

        if (initialAuthState.current) {
          initialAuthState.current = false;

          if (currentUser) {
            setIsSyncingProfile(true);
            syncUserProfile(currentUser)
              .then(() => setProfileSaved(true))
              .catch((error: unknown) => {
                setErrorMessage(getErrorMessage(error));
              })
              .finally(() => setIsSyncingProfile(false));
          } else {
            setProfileSaved(false);
            setErrorMessage("");
          }
        }
      },
      (error) => {
        setErrorMessage(getErrorMessage(error));
        setIsCheckingAuth(false);
      },
    );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setProfileSaved(false);

    try {
      if (mode === "sign-up") {
        const signedInUser = await registerUser(email, password, name);
        await syncUserProfile(signedInUser);
      } else {
        const signedInUser = await loginUser(email, password);
        await syncUserProfile(signedInUser);
      }
      setProfileSaved(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsSubmitting(true);
    setErrorMessage("");
    setProfileSaved(false);

    try {
      const signedInUser = await googleLogin();
      await syncUserProfile(signedInUser);
      setProfileSaved(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await logoutUser();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProfileSync() {
    if (!user) return;

    setIsSyncingProfile(true);
    setErrorMessage("");

    try {
      await syncUserProfile(user);
      setProfileSaved(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSyncingProfile(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30 md:grid-cols-2">
        <section className="flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-900 p-8 sm:p-12">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Scholar AI
          </Link>
          <div className="my-12">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-indigo-200">
              Your learning, in focus
            </p>
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Make space for your next big idea.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-indigo-100/80">
              Sign in to continue to your Scholar AI account.
            </p>
          </div>
          <p className="text-sm text-indigo-100/60">
            A smarter place to study and grow.
          </p>
        </section>

        <section className="flex items-center justify-center p-8 sm:p-12">
          {isCheckingAuth ? (
            <p className="text-sm text-slate-400" role="status">
              Checking your sign-in…
            </p>
          ) : user ? (
            <div className="w-full max-w-sm">
              <p className="text-sm font-medium text-indigo-300">
                Account connected
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Welcome{user.displayName ? `, ${user.displayName}` : " back"}
              </h2>
              <p className="mt-3 break-all text-slate-400">{user.email}</p>
              {isSyncingProfile && (
                <p className="mt-4 text-sm text-slate-400" role="status">
                  Saving your profile…
                </p>
              )}
              {profileSaved && !isSyncingProfile && (
                <p className="mt-4 text-sm text-emerald-300">
                  Your profile is saved.
                </p>
              )}
              {errorMessage && (
                <p className="mt-5 text-sm text-rose-300" role="alert">
                  {errorMessage}
                </p>
              )}
              {!profileSaved && !isSyncingProfile && (
                <button
                  type="button"
                  onClick={handleProfileSync}
                  className="mt-5 text-sm font-medium text-indigo-300 hover:text-indigo-200"
                >
                  Retry saving profile
                </button>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSubmitting}
                className="mt-8 w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              <h2 className="text-3xl font-semibold tracking-tight">
                {mode === "sign-in" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {mode === "sign-in"
                  ? "Sign in with your email or Google account."
                  : "Get started with your email or Google account."}
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-medium transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span aria-hidden="true" className="font-bold text-lg">
                  G
                </span>
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-4 text-xs text-slate-500">
                <span className="h-px flex-1 bg-slate-700" />
                OR CONTINUE WITH EMAIL
                <span className="h-px flex-1 bg-slate-700" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "sign-up" && (
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      maxLength={255}
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                      placeholder="Your name"
                    />
                  </div>
                )}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "sign-in" ? "current-password" : "new-password"
                    }
                    minLength={6}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                    placeholder="At least 6 characters"
                  />
                </div>

                {errorMessage && (
                  <p className="text-sm text-rose-300" role="alert">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Please wait…"
                    : mode === "sign-in"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                {mode === "sign-in"
                  ? "New to Scholar AI?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                    setErrorMessage("");
                  }}
                  className="font-medium text-indigo-300 hover:text-indigo-200"
                >
                  {mode === "sign-in" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
