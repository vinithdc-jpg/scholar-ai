"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getUserRole } from "@/lib/auth";
import { auth } from "@/lib/firebase";

export default function AuthenticatedHome({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "signed-out" | "error">(
    "checking",
  );

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          getUserRole(user)
            .then((role) => {
              if (!active) return;
              router.replace(
                role === "student" ? "/dashboard" : "/admin",
              );
            })
            .catch(() => {
              if (active) setStatus("error");
            });
          return;
        }

        setStatus("signed-out");
      },
      () => {
        if (active) setStatus("error");
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
        Checking your account…
      </main>
    );
  }

  if (status === "error") {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-white px-5 text-center text-sm text-rose-600"
        role="alert"
      >
        Unable to verify your account. Refresh the page to try again.
      </main>
    );
  }

  return children;
}
