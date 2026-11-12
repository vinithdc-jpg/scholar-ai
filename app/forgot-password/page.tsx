"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Mail,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f3ff] px-5 py-10">
      <div className="w-full max-w-[430px] rounded-[24px] border border-[#ddd6fe] bg-white p-6 shadow-[0_20px_70px_rgba(47,48,100,0.07)] sm:p-9">
        <Link
          href="/"
          className="flex items-center gap-2 text-[15px] font-extrabold tracking-[-0.05em] text-[#0f172a]"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-[#6366f1] text-white">
            <GraduationCap size={18} />
          </span>
          scholar<span className="-ml-2 text-[#6366f1]">ai</span>
        </Link>
        {submitted ? (
          <div role="status" className="mt-9 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eef2ff] text-[#312e81]">
              <CheckCircle2 size={22} />
            </span>
            <h1 className="mt-5 text-[22px] font-extrabold tracking-[-0.04em] text-[#0f172a]">
              Check your inbox
            </h1>
            <p className="mt-2 text-[11px] leading-5 text-[#838a9d]">
              This frontend demo doesn’t send email, but a reset link would
              arrive here in a connected account flow.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold text-[#6366f1] hover:underline"
            >
              <ArrowLeft size={13} /> Return to log in
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-9 grid size-11 place-items-center rounded-2xl bg-[#e0e7ff] text-[#6366f1]">
              <Mail size={19} />
            </div>
            <h1 className="mt-5 text-[23px] font-extrabold tracking-[-0.05em] text-[#0f172a]">
              Forgot your password?
            </h1>
            <p className="mt-2 text-[11px] leading-5 text-[#838a9d]">
              No worries. Enter the email address associated with your account
              and we’ll help you find your way back.
            </p>
            <form onSubmit={handleSubmit} className="mt-6">
              <label
                className="mb-1.5 block text-[10px] font-semibold text-[#596176]"
                htmlFor="reset-email"
              >
                Email address
              </label>
              <input
                id="reset-email"
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3.5 text-[12px] text-[#0f172a] outline-none placeholder:text-[#a3a9b8] focus:border-[#a5b4fc]"
              />
              <button
                type="submit"
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] text-[11px] font-bold text-white transition hover:bg-[#312e81]"
              >
                Continue <ArrowRight size={14} />
              </button>
            </form>
            <Link
              href="/login"
              className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold text-[#858c9e] hover:text-[#312e81]"
            >
              <ArrowLeft size={13} /> Back to log in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
