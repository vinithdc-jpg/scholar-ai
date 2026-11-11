"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, GraduationCap, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.85fr_1.15fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#312e81] via-[#6366f1] to-[#6366f1] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-36 top-20 size-[440px] rounded-full border border-white/10" />
        <div className="absolute -right-16 top-44 size-[280px] rounded-full border border-white/10" />
        <Link href="/" className="relative z-10 flex items-center gap-2.5 text-[17px] font-extrabold tracking-[-0.05em]"><span className="grid size-9 place-items-center rounded-xl bg-white/15"><GraduationCap size={21} /></span>scholarai</Link>
        <div className="relative z-10 max-w-[440px]">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15"><Sparkles size={22} /></span>
          <h1 className="mt-6 text-[42px] font-extrabold leading-tight tracking-[-0.06em]">Make room for what’s possible.</h1>
          <p className="mt-4 text-[13px] leading-6 text-indigo-100">One profile can open the door to opportunities that understand your goals and your story.</p>
        </div>
        <p className="relative z-10 text-[10px] text-indigo-100/70">A clearer path to the support you deserve.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[410px]">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#858c9e] hover:text-[#312e81]"><ArrowLeft size={13} /> Back to home</Link>
          <div className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6366f1]">Your next chapter starts here</p>
            <h2 className="mt-2 text-[29px] font-extrabold tracking-[-0.05em] text-[#0f172a]">Create your account</h2>
            <p className="mt-2 text-[12px] text-[#858c9e]">Build a profile and find scholarships made for you.</p>
          </div>
          {submitted ? (
            <div role="status" className="mt-8 rounded-2xl border border-[#eef2ff] bg-[#eef2ff] p-5">
              <p className="text-[13px] font-bold text-[#312e81]">Your demo profile is ready!</p>
              <p className="mt-2 text-[11px] leading-5 text-[#6366f1]">This preview doesn’t create an account. Explore the sample scholarship workspace to see what’s possible.</p>
              <Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[11px] font-bold text-white">Explore dashboard <ArrowRight size={13} /></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-[#596176]">Full name</span><input required autoComplete="name" placeholder="Jordan Davis" className="h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3.5 text-[12px] text-[#0f172a] outline-none placeholder:text-[#a3a9b8] focus:border-[#a5b4fc] focus:ring-2 focus:ring-[#6366f1]/10" /></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-[#596176]">Email address</span><input required type="email" autoComplete="email" placeholder="you@example.com" className="h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3.5 text-[12px] text-[#0f172a] outline-none placeholder:text-[#a3a9b8] focus:border-[#a5b4fc] focus:ring-2 focus:ring-[#6366f1]/10" /></label>
              <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-[#596176]">Password</span><input required type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" className="h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3.5 text-[12px] text-[#0f172a] outline-none placeholder:text-[#a3a9b8] focus:border-[#a5b4fc] focus:ring-2 focus:ring-[#6366f1]/10" /></label>
              <label className="flex items-start gap-2.5 text-[10px] leading-5 text-[#7d8497]"><input required type="checkbox" className="mt-1 size-3.5 accent-[#6366f1]" />I agree to the terms and understand this is a frontend-only demo.</label>
              <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] text-[11px] font-bold text-white transition hover:bg-[#312e81]">Create account <ArrowRight size={14} /></button>
              <p className="text-center text-[10px] text-[#858c9e]">Already have an account? <Link href="/login" className="font-bold text-[#6366f1] hover:underline">Log in</Link></p>
            </form>
          )}
          <p className="mt-7 text-center text-[9px] leading-4 text-[#a2a8b5]">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </section>
    </main>
  );
}
