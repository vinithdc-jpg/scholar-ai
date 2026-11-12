"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  GraduationCap,
  Info,
  Sparkles,
  Target,
} from "lucide-react";
import { Surface } from "@/components/ui";

export default function EligibilityPage() {
  const [submitted, setSubmitted] = useState(false);
  const [level, setLevel] = useState("Undergraduate");
  const [field, setField] = useState("Computer Science");
  const [gpa, setGpa] = useState("3.5");
  const [firstGeneration, setFirstGeneration] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-262.5">
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e0e7ff] text-[#6366f1]">
          <Target size={21} />
        </span>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#6366f1]">
          A little clarity goes a long way
        </p>
        <h1 className="mt-2 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[32px]">
          Check your scholarship fit
        </h1>
        <p className="mx-auto mt-2 max-w-127.5 text-[12px] leading-5 text-[#858c9e]">
          Share a few details to see how your profile lines up with our sample
          opportunities.
        </p>
      </div>

      <div className="mx-auto mt-7 grid max-w-225 gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Surface className="p-5 sm:p-7">
          <h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">
            About your studies
          </h2>
          <p className="mt-1 text-[10px] text-[#8d94a5]">
            This information stays on this page and is only used for this demo
            result.
          </p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5f677b]">
                Current education level
              </span>
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
              >
                <option>High school</option>
                <option>Undergraduate</option>
                <option>Graduate</option>
                <option>Doctoral</option>
                <option>Trade or vocational</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5f677b]">
                Field of study
              </span>
              <select
                value={field}
                onChange={(event) => setField(event.target.value)}
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
              >
                <option>Computer Science</option>
                <option>Engineering</option>
                <option>Business</option>
                <option>Education</option>
                <option>Health Sciences</option>
                <option>Arts & Humanities</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5f677b]">
                Current GPA
              </span>
              <select
                value={gpa}
                onChange={(event) => setGpa(event.target.value)}
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
              >
                <option value="4.0">3.8 – 4.0</option>
                <option value="3.5">3.5 – 3.79</option>
                <option value="3.2">3.2 – 3.49</option>
                <option value="3.0">3.0 – 3.19</option>
                <option value="2.5">Below 3.0</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ddd6fe] p-3.5">
              <input
                type="checkbox"
                checked={firstGeneration}
                onChange={(event) => setFirstGeneration(event.target.checked)}
                className="mt-0.5 size-4 accent-[#6366f1]"
              />
              <span>
                <span className="block text-[11px] font-semibold text-[#51596d]">
                  I’m a first-generation college student
                </span>
                <span className="mt-1 block text-[10px] leading-4 text-[#9298a8]">
                  The first in my immediate family to attend college.
                </span>
              </span>
            </label>
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] text-[11px] font-bold text-white transition hover:bg-[#312e81]"
            >
              <Sparkles size={14} /> Check my eligibility{" "}
              <ArrowRight size={14} />
            </button>
          </form>
        </Surface>

        <div className="space-y-4">
          {submitted ? (
            <Surface aria-live="polite" className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef2ff] text-[#6366f1]">
                  <BadgeCheck size={19} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                    Your sample results are ready
                  </p>
                  <p className="mt-1 text-[10px] text-[#8990a2]">
                    Based on {level.toLowerCase()} study and a {gpa} GPA range.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-[#eef2ff] bg-[#eef2ff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold text-[#312e81]">
                      Bright Futures Fellowship
                    </p>
                    <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#6366f1]">
                      Likely eligible
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] leading-5 text-[#6366f1]">
                    Your education level and selected GPA meet the sample
                    criteria. Community involvement is also required.
                  </p>
                </div>
                {field.toLowerCase().includes("computer") ||
                field === "Engineering" ? (
                  <div className="rounded-xl border border-[#e0e7ff] bg-[#f5f3ff] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold text-[#312e81]">
                        Future STEM Leaders Award
                      </p>
                      <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#5d64cf]">
                        Strong match
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-[#7880a5]">
                      Your field of study is aligned. Confirm residency and
                      enrollment with the provider.
                    </p>
                  </div>
                ) : null}
                {firstGeneration && (
                  <div className="rounded-xl border border-[#f0eafa] bg-[#ede9fe] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold text-[#312e81]">
                        First Generation Scholars Fund
                      </p>
                      <span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#312e81]">
                        Profile match
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] leading-5 text-[#89809a]">
                      Your first-generation status may fit this opportunity’s
                      student criteria.
                    </p>
                  </div>
                )}
              </div>
              <Link
                href="/scholarships"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#6366f1] py-2.5 text-[11px] font-bold text-white hover:bg-[#312e81]"
              >
                Explore matching scholarships <ArrowRight size={14} />
              </Link>
            </Surface>
          ) : (
            <Surface className="flex min-h-62.5 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e0e7ff] text-[#6366f1]">
                <GraduationCap size={22} />
              </span>
              <h2 className="mt-4 text-[14px] font-bold text-[#0f172a] dark:text-white">
                Your results will appear here
              </h2>
              <p className="mt-2 max-w-65 text-[10px] leading-5 text-[#8c93a4]">
                Complete the form to see a transparent, sample eligibility
                check.
              </p>
            </Surface>
          )}
          <Surface className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold text-[#0f172a] dark:text-white">
              <Info size={15} className="text-[#6366f1]" /> A helpful starting
              point, not a guarantee
            </p>
            <p className="mt-2 text-[10px] leading-5 text-[#8a91a1]">
              Eligibility is estimated from your answers and sample criteria.
              Requirements can change; confirm details with each scholarship
              provider.
            </p>
            <Link
              href="/assistant"
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#6366f1] hover:underline"
            >
              Have a question? Ask ScholarAI <CircleHelp size={12} />
            </Link>
          </Surface>
        </div>
      </div>
    </div>
  );
}
