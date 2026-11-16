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
import { CustomSelect } from "@/components/custom-fields";
import {
  toScholarshipDisplay,
  type ScholarshipRecord,
} from "@/lib/scholarship-display";
import type { Scholarship } from "@/lib/sample-data";
import { apiRequest } from "@/lib/api/client";
import { auth } from "@/lib/firebase";

type ScholarshipListResponse = {
  scholarships?: ScholarshipRecord[];
  pagination?: { total: number };
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
  const [page, setPage] = useState(1);
  const [educationLevel, setEducationLevel] = useState("");
  const [course, setCourse] = useState("");
  const [state, setState] = useState("");
  const [scholarshipType, setScholarshipType] = useState("");
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [catalogScholarships, setCatalogScholarships] = useState<Scholarship[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, setUser, (error) =>
      setLoadError(error.message),
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (query.trim()) params.set("q", query.trim());
      if (educationLevel) params.set("education_level", educationLevel);
      if (course) params.set("course", course);
      if (state.trim()) params.set("state", state.trim());
      if (scholarshipType) params.set("scholarship_type", scholarshipType);
      setIsLoading(true);
      setLoadError("");
      void apiRequest<ScholarshipListResponse>(
        `/api/scholarships/search?${params.toString()}`,
      )
        .then((result) => {
          if (!Array.isArray(result.scholarships)) {
            throw new Error("The scholarship list response is invalid.");
          }
          if (active) {
            setCatalogScholarships(
              result.scholarships.map(toScholarshipDisplay),
            );
            setTotal(result.pagination?.total ?? result.scholarships.length);
          }
        })
        .catch((cause: unknown) => {
          if (active) {
            setLoadError(
              cause instanceof Error
                ? cause.message
                : "Unable to load scholarships.",
            );
            setCatalogScholarships([]);
            setTotal(0);
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, educationLevel, course, state, scholarshipType, page, user]);

  const availableCategories = useMemo(
    () => [
      ...categories.slice(0, 1),
      ...new Set([
        ...categories.slice(1),
        ...catalogScholarships.map((scholarship) => scholarship.category),
      ]),
    ],
    [catalogScholarships],
  );
  const filteredScholarships = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = catalogScholarships.filter((scholarship) => {
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
    return [...filtered].sort((a, b) => (b.match ?? -1) - (a.match ?? -1));
  }, [catalogScholarships, category, query, sortBy]);

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
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
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
          <div className="flex items-center gap-2 text-[11px] text-[#858c9e]">
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Sort by</span>
            <CustomSelect
              value={sortBy}
              onValueChange={setSortBy}
              ariaLabel="Sort scholarships"
              options={[
                { label: "Best match", value: "Best match" },
                { label: "Deadline", value: "Deadline" },
                { label: "Award amount", value: "Award amount" },
              ]}
              className="w-[150px] text-[11px]"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} className="mr-1 shrink-0 text-[#9aa1b1]" />
          {availableCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(item);
                setPage(1);
              }}
              aria-pressed={category === item}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${category === item ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-[#ddd6fe] bg-white text-[#70788d] hover:border-[#e0e7ff] hover:text-[#6366f1]"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CustomSelect
            value={educationLevel}
            onValueChange={(value) => {
              setEducationLevel(value);
              setPage(1);
            }}
            ariaLabel="Filter by education level"
            options={[
              { value: "", label: "Any education level" },
              ...[
                "High school",
                "Undergraduate",
                "Graduate",
                "Doctoral",
                "Trade or vocational",
              ].map((value) => ({ value, label: value })),
            ]}
            className="text-[11px]"
          />
          <CustomSelect
            value={course}
            onValueChange={(value) => {
              setCourse(value);
              setPage(1);
            }}
            ariaLabel="Filter by field of study"
            options={[
              { value: "", label: "Any field of study" },
              ...[
                "Computer Science",
                "Engineering",
                "Business",
                "Education",
                "Health Sciences",
                "Arts & Humanities",
              ].map((value) => ({ value, label: value })),
            ]}
            className="text-[11px]"
          />
          <label className="sr-only" htmlFor="scholarship-state">
            Filter by eligible state
          </label>
          <input
            id="scholarship-state"
            value={state}
            onChange={(event) => {
              setState(event.target.value);
              setPage(1);
            }}
            placeholder="Any eligible state"
            className="workspace-input h-10 rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] px-3 text-[11px] text-[#384057] outline-none placeholder:text-[#858c9e] focus:border-[#a5b4fc] focus:bg-white"
          />
          <CustomSelect
            value={scholarshipType}
            onValueChange={(value) => {
              setScholarshipType(value);
              setPage(1);
            }}
            ariaLabel="Filter by scholarship type"
            options={[
              { value: "", label: "Any scholarship type" },
              ...["Merit", "Need-based", "STEM", "Community"].map((value) => ({
                value,
                label: value,
              })),
            ]}
            className="text-[11px]"
          />
        </div>
      </div>
      <div className="mb-4 mt-7 flex items-center justify-between">
        <p className="text-[12px] text-[#81889a]">
          <strong className="font-bold text-[#3d4359] dark:text-white">
            {filteredScholarships.length} opportunities
          </strong>{" "}
          {total > filteredScholarships.length
            ? `from ${total} matching published scholarships`
            : "for your profile"}
        </p>
        <button
          type="button"
          onClick={() => {
            setCategory("All opportunities");
            setQuery("");
            setSortBy("Best match");
            setPage(1);
            setEducationLevel("");
            setCourse("");
            setState("");
            setScholarshipType("");
          }}
          className="text-[10px] font-semibold text-[#6366f1] hover:underline"
        >
          Reset filters
        </button>
      </div>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-[#858c9e]" role="status">
          Searching published scholarships…
        </p>
      ) : filteredScholarships.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredScholarships.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
          {total > 20 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                disabled={page === 1 || isLoading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-[#ddd6fe] px-3 py-2 text-[10px] font-semibold text-[#6366f1] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[10px] text-[#858c9e]">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / 20) || isLoading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-[#ddd6fe] px-3 py-2 text-[10px] font-semibold text-[#6366f1] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
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
              setPage(1);
              setEducationLevel("");
              setCourse("");
              setState("");
              setScholarshipType("");
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
