"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import ScholarshipCard from "@/components/scholarship-card";
import { scholarships } from "@/lib/sample-data";
import {
  toScholarshipDisplay,
  type ScholarshipRecord,
} from "@/lib/scholarship-display";
import type { Scholarship } from "@/lib/sample-data";
import { auth } from "@/lib/firebase";

type ScholarshipListResponse = {
  error?: string;
  scholarships?: ScholarshipRecord[];
};

const categories = [
  "All opportunities",
  "Undergraduate",
  "STEM",
  "Community",
  "First-generation",
];

export default function ScholarshipDiscovery({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("All opportunities");
  const [sortBy, setSortBy] = useState("Best match");
  const [submittedScholarships, setSubmittedScholarships] = useState<
    Scholarship[]
  >([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadScholarships(user: User) {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/scholarships?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = (await response.json()) as ScholarshipListResponse;
        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load submitted scholarships.");
        }
        if (!Array.isArray(result.scholarships)) {
          throw new Error("The scholarship list response is invalid.");
        }
        if (active) {
          setSubmittedScholarships(
            result.scholarships.map(toScholarshipDisplay),
          );
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load submitted scholarships.",
          );
        }
      }
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) void loadScholarships(user);
      },
      (error) => {
        if (active) setLoadError(error.message);
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const allScholarships = useMemo(
    () => [...submittedScholarships, ...scholarships],
    [submittedScholarships],
  );
  const availableCategories = useMemo(
    () => [
      ...categories.slice(0, 1),
      ...new Set([
        ...categories.slice(1),
        ...submittedScholarships.map((scholarship) => scholarship.category),
      ]),
    ],
    [submittedScholarships],
  );
  const filteredScholarships = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = allScholarships.filter((scholarship) => {
      const matchesCategory =
        category === "All opportunities" || scholarship.category === category;
      const matchesQuery =
        !normalizedQuery ||
        `${scholarship.name} ${scholarship.provider} ${scholarship.category} ${scholarship.description}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
    if (sortBy === "Deadline")
      return [...filtered].sort((a, b) => a.daysLeft - b.daysLeft);
    if (sortBy === "Award amount")
      return [...filtered].sort(
        (a, b) =>
          Number(b.amount.replace(/\D/g, "")) -
          Number(a.amount.replace(/\D/g, "")),
      );
    return [...filtered].sort(
      (a, b) => (b.match ?? -1) - (a.match ?? -1),
    );
  }, [allScholarships, category, query, sortBy]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
            Find your next step
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[31px]">
            Explore scholarships
          </h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            Thoughtful matches, clear details, and real opportunities.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/scholarships/submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6366f1] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#312e81]"
          >
            <Plus size={13} /> Add a scholarship
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e0e7ff] px-3 py-1.5 text-[10px] font-semibold text-[#6366f1]">
            <Sparkles size={12} /> Personalized for you
          </span>
        </div>
      </div>
      {loadError && (
        <p
          className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {loadError}
        </p>
      )}
      <div className="mt-6 rounded-2xl border border-[#ddd6fe] bg-white p-4 shadow-[0_2px_8px_rgba(29,36,68,0.025)] sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a7b6]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, field, or provider..."
              aria-label="Search scholarships"
              className="workspace-input h-11 w-full rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] pl-10 pr-10 text-[12px] text-[#384057] outline-none placeholder:text-[#a0a6b5] focus:border-[#a5b4fc] focus:bg-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a6b5]"
              >
                <X size={15} />
              </button>
            )}
          </label>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#858c9e]">
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort scholarships"
              className="bg-transparent font-semibold text-[#555d72] outline-none"
            >
              <option>Best match</option>
              <option>Deadline</option>
              <option>Award amount</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="mr-1 shrink-0 text-[#9aa1b1]" />
          {availableCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${category === item ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-[#ddd6fe] bg-white text-[#70788d] hover:border-[#e0e7ff] hover:text-[#6366f1]"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 mt-7 flex items-center justify-between">
        <p className="text-[12px] text-[#81889a]">
          <strong className="font-bold text-[#3d4359] dark:text-white">
            {filteredScholarships.length} opportunities
          </strong>{" "}
          for your profile
        </p>
        <button
          type="button"
          onClick={() => {
            setCategory("All opportunities");
            setQuery("");
            setSortBy("Best match");
          }}
          className="text-[10px] font-semibold text-[#6366f1] hover:underline"
        >
          Reset filters
        </button>
      </div>
      {filteredScholarships.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredScholarships.map((scholarship) => (
            <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#ddd6fe] bg-white px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e0e7ff] text-[#6366f1]">
            <Search size={20} />
          </span>
          <h2 className="mt-4 text-[15px] font-bold text-[#0f172a]">
            No scholarships found
          </h2>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            Try a different search or clear your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory("All opportunities");
              setQuery("");
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[11px] font-bold text-white"
          >
            <X size={13} /> Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
