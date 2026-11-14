"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { FirebaseError } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import {
  type AppRole,
  googleLogin,
  loginUser,
  logoutUser,
  registerUser,
  syncUserProfile,
} from "@/lib/auth";

type AuthMode = "sign-in" | "sign-up";
type AuthPanelProps = {
  superAdminEmail?: string;
};

function getPostLoginPath(role: AppRole) {
  return role === "student" ? "/dashboard" : "/admin";
}

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

export default function AuthPanel({ superAdminEmail }: AuthPanelProps = {}) {
  const isSuperAdminLogin = superAdminEmail !== undefined;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(superAdminEmail ?? "");
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
              .then((profile) => {
                setProfileSaved(true);
                router.replace(getPostLoginPath(profile.role));
              })
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
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setProfileSaved(false);

    try {
      let profile: Awaited<ReturnType<typeof syncUserProfile>>;
      if (mode === "sign-up") {
        const signedInUser = await registerUser(email, password, name);
        profile = await syncUserProfile(signedInUser);
      } else {
        const signedInUser = await loginUser(email, password, {
          superAdminOnly: isSuperAdminLogin,
        });
        profile = await syncUserProfile(signedInUser);
      }
      if (isSuperAdminLogin && profile.role !== "super_admin") {
        throw new Error("This account does not have super-admin access.");
      }
      router.replace(getPostLoginPath(profile.role));
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
      const profile = await syncUserProfile(signedInUser);
      router.replace(getPostLoginPath(profile.role));
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
    <main className="flex min-h-screen items-center justify-center bg-[#f5f3ff] px-4 py-8 text-[#0f172a] sm:px-5 sm:py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] md:grid-cols-2">
        <section className="flex flex-col justify-between bg-linear-to-br from-[#312e81] via-[#4338ca] to-[#6366f1] p-8 text-white sm:p-12">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Scholar<span className="text-indigo-300">AI</span>
          </Link>
          <div className="my-12">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">
              Your learning, in focus
            </p>
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Make space for your next big idea.
            </h1>
            <p className="mt-5 max-w-md leading-7 text-slate-300">
              Sign in to continue to your Scholar AI account.
            </p>
          </div>
          <p className="text-sm text-slate-400">
            A smarter place to study and grow.
          </p>
        </section>

        <section className="flex items-center justify-center p-8 sm:p-12">
          {isCheckingAuth ? (
            <p className="text-sm text-slate-500" role="status">
              Checking your sign-in…
            </p>
          ) : user ? (
            <div className="w-full max-w-sm">
              <p className="text-sm font-medium text-indigo-700">
                Account connected
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Welcome{user.displayName ? `, ${user.displayName}` : " back"}
              </h2>
              <p className="mt-3 break-all text-slate-500">{user.email}</p>
              {isSyncingProfile && (
                <p className="mt-4 text-sm text-slate-500" role="status">
                  Saving your profile…
                </p>
              )}
              {profileSaved && !isSyncingProfile && (
                <p className="mt-4 text-sm text-indigo-700">
                  Your profile is saved.
                </p>
              )}
              {errorMessage && (
                <p className="mt-5 text-sm text-rose-600" role="alert">
                  {errorMessage}
                </p>
              )}
              {!profileSaved && !isSyncingProfile && (
                <button
                  type="button"
                  onClick={handleProfileSync}
                  className="mt-5 text-sm font-medium text-indigo-700 hover:text-indigo-800"
                >
                  Retry saving profile
                </button>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSubmitting}
                className="mt-8 w-full rounded-xl bg-[#6366f1] px-4 py-3 font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm">
              <h2 className="text-3xl font-semibold tracking-tight">
                {isSuperAdminLogin
                  ? "Super admin sign in"
                  : mode === "sign-in"
                    ? "Welcome back"
                    : "Create your account"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {isSuperAdminLogin
                  ? "Sign in to manage ScholarAI administrators."
                  : mode === "sign-in"
                    ? "Sign in with your email or Google account."
                    : "Get started with your email or Google account."}
              </p>

              {!isSuperAdminLogin && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span aria-hidden="true" className="font-bold text-lg">
                    G
                  </span>
                  Continue with Google
                </button>
              )}

              {!isSuperAdminLogin && (
                <div className="my-6 flex items-center gap-4 text-xs text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  OR CONTINUE WITH EMAIL
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === "sign-up" && (
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-slate-700"
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                      placeholder="Your name"
                    />
                  </div>
                )}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    placeholder={
                      isSuperAdminLogin ? undefined : "you@example.com"
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                    placeholder="At least 6 characters"
                  />
                </div>

                {errorMessage && (
                  <p className="text-sm text-rose-600" role="alert">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#6366f1] px-4 py-3 font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Please wait…"
                    : mode === "sign-in"
                      ? "Sign in"
                      : "Create account"}
                </button>
              </form>

              {mode === "sign-in" && (
                <div className="mt-3 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-indigo-700 hover:text-indigo-800"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {isSuperAdminLogin ? (
                <p className="mt-6 text-center text-sm text-slate-500">
                  <Link
                    href="/login"
                    className="font-medium text-indigo-700 hover:text-indigo-800"
                  >
                    Return to regular sign in
                  </Link>
                </p>
              ) : (
                <>
                  <p className="mt-6 text-center text-sm text-slate-500">
                    {mode === "sign-in"
                      ? "New to Scholar AI?"
                      : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                        setErrorMessage("");
                      }}
                      className="font-medium text-indigo-700 hover:text-indigo-800"
                    >
                      {mode === "sign-in" ? "Create an account" : "Sign in"}
                    </button>
                  </p>
                  {mode === "sign-in" && (
                    <p className="mt-4 text-center text-sm text-slate-500">
                      Super admin?{" "}
                      <Link
                        href="/super-admin"
                        className="font-medium text-indigo-700 hover:text-indigo-800"
                      >
                        Sign in here
                      </Link>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
