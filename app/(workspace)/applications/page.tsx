"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock3,
  FileCheck2,
  Plus,
  Trash2,
} from "lucide-react";
import { Pill, ProgressBar, Surface } from "@/components/ui";
import { CustomSelect } from "@/components/custom-fields";
import { apiRequest } from "@/lib/api/client";

type Application = {
  id: number;
  scholarship_id: number;
  scholarship_name: string;
  provider: string;
  application_deadline: string | null;
  status:
    | "not_started"
    | "in_progress"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "withdrawn";
  student_notes: string | null;
  applied_at: string | null;
};

type ApplicationHistory = {
  id: number;
  previous_status: Application["status"] | null;
  new_status: Application["status"];
  notes: string | null;
  created_at: string;
};

type ApplicationDetails = {
  application: Application;
  history: ApplicationHistory[];
};

const statuses: Application["status"][] = [
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "withdrawn",
];

const applicationFilters = [
  "All applications",
  "In progress",
  "Submitted",
  "Not started",
];

function statusLabel(status: Application["status"]) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function progressFor(status: Application["status"]) {
  if (status === "approved" || status === "submitted") return 100;
  if (status === "under_review") return 85;
  if (status === "in_progress") return 50;
  return 0;
}

function formatDeadline(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No deadline"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(date);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState("All applications");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<Record<number, ApplicationDetails>>({});
  const [openId, setOpenId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const loadApplications = useCallback(async () => {
    const result = await apiRequest<{ applications: Application[] }>(
      "/api/applications?limit=100",
    );
    if (!Array.isArray(result.applications)) {
      throw new Error("The applications response is invalid.");
    }
    setApplications(result.applications);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadApplications()
        .catch((cause: unknown) => {
          if (active) setError(errorText(cause));
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadApplications]);

  const filtered = useMemo(
    () =>
      applications.filter(
        (item) =>
          filter === "All applications" ||
          statusLabel(item.status).toLowerCase() === filter.toLowerCase(),
      ),
    [applications, filter],
  );
  const inProgressCount = applications.filter(
    (item) => item.status === "in_progress" || item.status === "not_started",
  ).length;
  const submittedCount = applications.filter((item) =>
    ["submitted", "under_review", "approved"].includes(item.status),
  ).length;
  const upcomingCount = applications.filter((item) => {
    if (!item.application_deadline) return false;
    const deadline = new Date(item.application_deadline);
    return deadline >= new Date() && item.status !== "submitted";
  }).length;

  async function updateApplication(
    application: Application,
    patch: Partial<Pick<Application, "status" | "student_notes">>,
  ) {
    setBusyId(application.id);
    setError("");
    try {
      const result = await apiRequest<{ application: Application }>(
        `/api/applications/${application.id}`,
        { method: "PATCH", body: JSON.stringify(patch) },
      );
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? result.application : item,
        ),
      );
      if (details[application.id] && patch.status) {
        const detail = await apiRequest<ApplicationDetails>(
          `/api/applications/${application.id}`,
        );
        setDetails((current) => ({ ...current, [application.id]: detail }));
      }
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function showDetails(applicationId: number) {
    if (openId === applicationId) {
      setOpenId(null);
      return;
    }
    setOpenId(applicationId);
    if (details[applicationId]) return;

    setBusyId(applicationId);
    setError("");
    try {
      const result = await apiRequest<ApplicationDetails>(
        `/api/applications/${applicationId}`,
      );
      setDetails((current) => ({ ...current, [applicationId]: result }));
      setNotes((current) => ({
        ...current,
        [applicationId]: result.application.student_notes ?? "",
      }));
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteApplication(applicationId: number) {
    if (!window.confirm("Remove this application from your tracker?")) return;
    setBusyId(applicationId);
    setError("");
    try {
      await apiRequest<{ success: boolean }>(
        `/api/applications/${applicationId}`,
        { method: "DELETE" },
      );
      setApplications((current) =>
        current.filter((item) => item.id !== applicationId),
      );
      setOpenId(null);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
            Your progress, all in one place
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[31px]">
            Application tracker
          </h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            Stay organized and feel good about every next step.
          </p>
        </div>
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#312e81]"
        >
          <Plus size={14} /> Start an application
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "In progress",
            value: String(inProgressCount),
            icon: CircleDashed,
            color: "bg-[#e0e7ff] text-[#6366f1]",
          },
          {
            label: "Submitted or reviewed",
            value: String(submittedCount),
            icon: CheckCircle2,
            color: "bg-[#eef2ff] text-[#312e81]",
          },
          {
            label: "Upcoming deadlines",
            value: String(upcomingCount),
            icon: CalendarDays,
            color: "bg-[#fef3c7] text-[#f59e0b]",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Surface key={label} className="flex items-center gap-3 p-4">
            <span className={`grid size-10 place-items-center rounded-xl ${color}`}>
              <Icon size={18} />
            </span>
            <div>
              <p className="text-[10px] text-[#9299aa]">{label}</p>
              <p className="mt-0.5 text-[20px] font-extrabold tracking-[-0.04em] text-[#0f172a] dark:text-white">
                {value}
              </p>
            </div>
          </Surface>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">
            Your applications
          </h2>
          <p className="mt-1 text-[10px] text-[#8a91a1]">
            Keep each application moving at your own pace.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#8b92a2]">
          Show
          <CustomSelect
            value={filter}
            onValueChange={setFilter}
            ariaLabel="Filter applications"
            options={applicationFilters.map((option) => ({
              value: option,
              label: option,
            }))}
            className="min-w-42.5 text-[11px] shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
          />
        </div>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-[#858c9e]" role="status">
          Loading your applications…
        </p>
      )}
      {!isLoading && filtered.length === 0 && (
        <Surface className="mt-4 px-6 py-12 text-center">
          <FileCheck2 className="mx-auto text-[#aaaebb]" size={22} />
          <p className="mt-3 text-[12px] font-semibold text-[#60677b]">
            No applications in this category yet.
          </p>
          <Link
            href="/scholarships"
            className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#6366f1]"
          >
            Find an opportunity <ArrowUpRight size={12} />
          </Link>
        </Surface>
      )}
      <div className="mt-4 space-y-3">
        {filtered.map((item) => {
          const progress = progressFor(item.status);
          const isOpen = openId === item.id;
          return (
            <Surface key={item.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e0e7ff] text-[#6366f1]">
                  <FileCheck2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[12px] font-bold text-[#0f172a] dark:text-white">
                      {item.scholarship_name}
                    </h3>
                    <Pill tone={item.status === "rejected" ? "amber" : "blue"}>
                      {statusLabel(item.status)}
                    </Pill>
                  </div>
                  <p className="mt-1 text-[10px] text-[#9299aa]">{item.provider}</p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-medium text-[#8b92a3]">
                  <Clock3 size={12} /> Due {formatDeadline(item.application_deadline)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div className="flex items-center gap-3">
                  <ProgressBar value={progress} color={progress === 100 ? "bg-[#312e81]" : undefined} />
                  <span className="text-[10px] font-semibold text-[#767e92]">
                    {progress}%
                  </span>
                </div>
                <label className="flex items-center gap-2 text-[10px] text-[#767e92]">
                  Status
                  <CustomSelect
                    value={item.status}
                    onValueChange={(value) =>
                      void updateApplication(item, {
                        status: value as Application["status"],
                      })
                    }
                    disabled={busyId === item.id}
                    ariaLabel={`Status for ${item.scholarship_name}`}
                    options={statuses.map((status) => ({
                      value: status,
                      label: statusLabel(status),
                    }))}
                    className="min-w-38 text-[10px]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void showDetails(item.id)}
                  disabled={busyId === item.id}
                  className="inline-flex items-center justify-center gap-1 text-[10px] font-bold text-[#6366f1] disabled:opacity-50"
                >
                  {isOpen ? "Hide details" : "Details"}
                  <ChevronDown size={13} className={isOpen ? "rotate-180" : ""} />
                </button>
              </div>
              {isOpen && (
                <div className="mt-4 border-t border-[#ddd6fe] pt-4">
                  {details[item.id] ? (
                    <>
                      <label className="block text-[10px] font-semibold text-[#626a7f]">
                        Your notes
                        <textarea
                          rows={3}
                          maxLength={10000}
                          value={notes[item.id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="workspace-input mt-2 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 py-2 text-[11px]"
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() =>
                            void updateApplication(item, {
                              student_notes: notes[item.id] ?? "",
                            })
                          }
                          className="rounded-lg bg-[#6366f1] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50"
                        >
                          Save notes
                        </button>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void deleteApplication(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-semibold text-rose-700 disabled:opacity-50"
                        >
                          <Trash2 size={12} /> Remove application
                        </button>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] font-bold text-[#626a7f]">
                          Status history
                        </p>
                        {details[item.id].history.map((event) => (
                          <p key={event.id} className="text-[10px] text-[#858c9e]">
                            {statusLabel(event.new_status)} ·{" "}
                            {new Date(event.created_at).toLocaleString()}
                            {event.notes ? ` · ${event.notes}` : ""}
                          </p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-[#858c9e]" role="status">
                      Loading application details…
                    </p>
                  )}
                  {item.application_deadline && (
                    <p className="mt-3 flex items-center gap-1 text-[10px] text-[#8990a2]">
                      <CalendarDays size={12} /> Deadline{" "}
                      {formatDeadline(item.application_deadline)}
                    </p>
                  )}
                </div>
              )}
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
