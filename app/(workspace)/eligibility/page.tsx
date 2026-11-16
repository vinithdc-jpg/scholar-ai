"use client";

import { useEffect, useState, type FormEvent } from "react";
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
import { CustomSelect } from "@/components/custom-fields";
import { apiRequest } from "@/lib/api/client";
import {
  toScholarshipDisplay,
  type ScholarshipRecord,
} from "@/lib/scholarship-display";
import type { Scholarship } from "@/lib/sample-data";

type EligibilityResult = {
  result:
    | "potentially_eligible"
    | "not_eligible"
    | "more_information_required";
  matched_conditions?: { field: string; description: string }[];
  failed_conditions?: {
    field: string;
    description: string;
    mandatory: boolean;
  }[];
  missing_information?: string[];
  source_url?: string | null;
};

const resultLabels: Record<EligibilityResult["result"], string> = {
  potentially_eligible: "Potentially eligible",
  not_eligible: "Does not currently meet mandatory requirements",
  more_information_required: "More information is needed",
};

export default function EligibilityPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipId, setScholarshipId] = useState("");
  const [level, setLevel] = useState("Undergraduate");
  const [field, setField] = useState("Computer Science");
  const [gpa, setGpa] = useState("87.5");
  const [firstGeneration, setFirstGeneration] = useState(true);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void apiRequest<{ scholarships: ScholarshipRecord[] }>(
      "/api/scholarships?limit=100",
    )
      .then((response) => {
        if (!Array.isArray(response.scholarships)) {
          throw new Error("The scholarship list response is invalid.");
        }
        if (!active) return;
        const options = response.scholarships.map(toScholarshipDisplay);
        setScholarships(options);
        const requestedId = new URLSearchParams(window.location.search).get(
          "scholarship_id",
        );
        setScholarshipId(
          options.find((item) => item.id === requestedId)?.id ??
            options[0]?.id ??
            "",
        );
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load scholarships.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!scholarshipId) {
      setError("Choose a scholarship before checking eligibility.");
      return;
    }

    setIsChecking(true);
    try {
      const response = await apiRequest<EligibilityResult>(
        "/api/eligibility/check",
        {
          method: "POST",
          body: JSON.stringify({
            scholarship_id: Number(scholarshipId),
            profile: {
              education_level: level,
              course: field,
              percentage: Number(gpa),
              first_generation: firstGeneration,
            },
          }),
        },
      );
      setResult(response);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to check eligibility.",
      );
    } finally {
      setIsChecking(false);
    }
  }

  const selectedScholarship = scholarships.find(
    (item) => item.id === scholarshipId,
  );

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
          Compare your answers with the published eligibility rules for a real
          scholarship.
        </p>
      </div>

      {error && (
        <p className="mx-auto mt-5 max-w-225 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div className="mx-auto mt-7 grid max-w-225 gap-5 lg:grid-cols-[1fr_0.85fr]">
        <Surface className="p-5 sm:p-7">
          <h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">
            About your studies
          </h2>
          <p className="mt-1 text-[10px] text-[#8d94a5]">
            Your answers are sent to the eligibility API for this check.
          </p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5f677b]">
                Scholarship
              </span>
              <CustomSelect
                value={scholarshipId}
                onValueChange={(value) => {
                  setScholarshipId(value);
                  setResult(null);
                }}
                ariaLabel="Scholarship to check"
                disabled={isLoading || scholarships.length === 0}
                options={scholarships.map((item) => ({
                  value: item.id,
                  label: `${item.name} — ${item.provider}`,
                }))}
                className="h-11 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5f677b]">
                Current education level
              </span>
              <CustomSelect
                value={level}
                onValueChange={setLevel}
                ariaLabel="Current education level"
                options={[
                  "High school",
                  "Undergraduate",
                  "Graduate",
                  "Doctoral",
                  "Trade or vocational",
                ].map((value) => ({ value, label: value }))}
                className="h-11 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5f677b]">
                Field of study
              </span>
              <CustomSelect
                value={field}
                onValueChange={setField}
                ariaLabel="Field of study"
                options={[
                  "Computer Science",
                  "Engineering",
                  "Business",
                  "Education",
                  "Health Sciences",
                  "Arts & Humanities",
                  "Other",
                ].map((value) => ({ value, label: value }))}
                className="h-11 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#5f677b]">
                Academic percentage
              </span>
              <CustomSelect
                value={gpa}
                onValueChange={setGpa}
                ariaLabel="Academic percentage"
                options={[
                { value: "95", label: "90% or higher" },
                { value: "87.5", label: "85% – 89%" },
                { value: "82.5", label: "80% – 84%" },
                { value: "77.5", label: "75% – 79%" },
                { value: "65", label: "Below 75%" },
                ]}
                className="h-11 text-[12px]"
              />
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
              disabled={isLoading || isChecking || scholarships.length === 0}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] text-[11px] font-bold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={14} />{" "}
              {isChecking ? "Checking…" : "Check my eligibility"}{" "}
              <ArrowRight size={14} />
            </button>
          </form>
        </Surface>

        <div className="space-y-4">
          {result ? (
            <Surface aria-live="polite" className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eef2ff] text-[#6366f1]">
                  <BadgeCheck size={19} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                    {resultLabels[result.result]}
                  </p>
                  <p className="mt-1 text-[10px] text-[#8990a2]">
                    {selectedScholarship?.name}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {result.matched_conditions?.map((condition) => (
                  <div
                    key={condition.field}
                    className="rounded-xl border border-[#eef2ff] bg-[#eef2ff] p-4"
                  >
                    <p className="text-[11px] font-bold text-[#312e81]">
                      Matched: {condition.description || condition.field}
                    </p>
                  </div>
                ))}
                {result.failed_conditions?.map((condition) => (
                  <div
                    key={condition.field}
                    className="rounded-xl border border-amber-100 bg-[#fef3c7] p-4"
                  >
                    <p className="text-[11px] font-bold text-[#92400e]">
                      Not matched: {condition.description || condition.field}
                    </p>
                  </div>
                ))}
                {result.missing_information?.map((fieldName) => (
                  <div
                    key={fieldName}
                    className="rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] p-4"
                  >
                    <p className="text-[11px] font-bold text-[#312e81]">
                      More information needed: {fieldName}
                    </p>
                  </div>
                ))}
                {!result.matched_conditions?.length &&
                  !result.failed_conditions?.length &&
                  !result.missing_information?.length && (
                    <p className="rounded-xl bg-[#f5f3ff] p-4 text-[10px] leading-5 text-[#727a8f]">
                      No detailed eligibility rules are available for this
                      scholarship yet.
                    </p>
                  )}
              </div>
              {result.source_url && (
                <a
                  href={result.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold text-[#6366f1] hover:underline"
                >
                  Review official source <ArrowRight size={12} />
                </a>
              )}
              <Link
                href="/scholarships"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#6366f1] py-2.5 text-[11px] font-bold text-white hover:bg-[#312e81]"
              >
                Explore scholarships <ArrowRight size={14} />
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
                Choose an opportunity to compare your answers with its published
                eligibility rules.
              </p>
            </Surface>
          )}
          <Surface className="p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold text-[#0f172a] dark:text-white">
              <Info size={15} className="text-[#6366f1]" /> A helpful starting
              point, not a guarantee
            </p>
            <p className="mt-2 text-[10px] leading-5 text-[#8a91a1]">
              Eligibility is an estimate based on available rules. Confirm
              current requirements with each scholarship provider.
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
