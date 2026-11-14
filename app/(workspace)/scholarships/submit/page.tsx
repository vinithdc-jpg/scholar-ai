"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { Pill, Surface } from "@/components/ui";
import { auth } from "@/lib/firebase";

type CreatedScholarship = { id: number | string; name: string };
type SubmissionResponse = {
  error?: string;
  scholarship?: CreatedScholarship;
};

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SubmitScholarshipPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdScholarship, setCreatedScholarship] =
    useState<CreatedScholarship | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setCreatedScholarship(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in again to submit a scholarship.");

      const form = event.currentTarget;
      const values = new FormData(form);
      const amount = String(values.get("amount") ?? "").trim();
      const incomeLimit = String(values.get("income_limit") ?? "").trim();
      const body = {
        name: String(values.get("name") ?? "").trim(),
        provider: String(values.get("provider") ?? "").trim(),
        description: String(values.get("description") ?? "").trim(),
        scholarship_type:
          String(values.get("scholarship_type") ?? "").trim() || null,
        education_levels: splitList(values.get("education_levels")),
        eligible_courses: splitList(values.get("eligible_courses")),
        eligible_states: splitList(values.get("eligible_states")),
        benefits: splitList(values.get("benefits")),
        amount: amount ? Number(amount) : null,
        income_limit: incomeLimit ? Number(incomeLimit) : null,
        application_start_date:
          String(values.get("application_start_date") ?? "").trim() || null,
        application_deadline:
          String(values.get("application_deadline") ?? "").trim() || null,
        official_application_url:
          String(values.get("official_application_url") ?? "").trim() || null,
        official_source_url: String(values.get("official_source_url") ?? "").trim(),
        academic_year: String(values.get("academic_year") ?? "").trim() || null,
      };

      if (
        (body.amount !== null && !Number.isFinite(body.amount)) ||
        (body.income_limit !== null && !Number.isFinite(body.income_limit))
      ) {
        throw new Error("Enter valid numeric amounts.");
      }

      const response = await fetch("/api/scholarship-submissions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const result = (await response.json()) as SubmissionResponse;
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to submit the scholarship.");
      }
      if (!result.scholarship) {
        throw new Error("The submission response is invalid.");
      }

      setCreatedScholarship(result.scholarship);
      form.reset();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the scholarship.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/scholarships"
        className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#767e91] hover:text-[#6366f1]"
      >
        <ArrowLeft size={14} /> Back to scholarships
      </Link>

      <div>
        <Pill tone="blue">Community contribution</Pill>
        <h1 className="mt-3 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[31px]">
          Add a scholarship
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-[#858c9e]">
          Share an opportunity with other students. It will appear in the catalog
          immediately and be labeled as community-submitted until an admin
          verifies it.
        </p>
      </div>

      {createdScholarship && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={17} />
            {createdScholarship.name} is now published.
          </span>
          <Link
            href={`/scholarships/${createdScholarship.id}`}
            className="font-semibold underline"
          >
            View scholarship
          </Link>
        </div>
      )}

      {errorMessage && (
        <p
          className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <Surface className="p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Scholarship name *
              </span>
              <input
                name="name"
                required
                maxLength={255}
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Provider *
              </span>
              <input
                name="provider"
                required
                maxLength={255}
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
              Description
            </span>
            <textarea
              name="description"
              maxLength={5000}
              rows={4}
              className="workspace-input w-full rounded-xl border border-[#ddd6fe] bg-white px-3 py-2.5 text-[12px]"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Scholarship type
              </span>
              <input
                name="scholarship_type"
                maxLength={120}
                placeholder="Merit, STEM, community…"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Academic year
              </span>
              <input
                name="academic_year"
                maxLength={32}
                placeholder="2026–2027"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Award amount
              </span>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Maximum family income
              </span>
              <input
                name="income_limit"
                type="number"
                min="0"
                step="0.01"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Application opens
              </span>
              <input
                name="application_start_date"
                type="date"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Application deadline
              </span>
              <input
                name="application_deadline"
                type="date"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
          </div>

          {[
            ["education_levels", "Education levels", "Undergraduate, Graduate…"],
            ["eligible_courses", "Eligible courses", "Computer science, Biology…"],
            ["eligible_states", "Eligible states or locations", "California, Texas…"],
            ["benefits", "Benefits", "Tuition support, mentorship…"],
          ].map(([name, label, placeholder]) => (
            <label key={name} className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                {label}
              </span>
              <textarea
                name={name}
                rows={2}
                placeholder={`${placeholder} (separate with commas or new lines)`}
                className="workspace-input w-full rounded-xl border border-[#ddd6fe] bg-white px-3 py-2.5 text-[12px]"
              />
            </label>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Official application URL
              </span>
              <input
                name="official_application_url"
                type="url"
                maxLength={2048}
                placeholder="https://"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#697186]">
                Official source URL *
              </span>
              <input
                name="official_source_url"
                type="url"
                required
                maxLength={2048}
                placeholder="https://"
                className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[12px]"
              />
            </label>
          </div>

          <p className="text-[11px] leading-5 text-[#858c9e]">
            Include the organization&apos;s official source. Submissions are
            immediately visible but remain marked unverified until reviewed.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6366f1] px-4 text-[12px] font-bold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? "Publishing…" : "Publish scholarship"}
            <ExternalLink size={14} />
          </button>
        </form>
      </Surface>
    </div>
  );
}