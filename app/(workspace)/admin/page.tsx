"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  GraduationCap,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { Pill, Surface } from "@/components/ui";
import { scholarships } from "@/lib/sample-data";

const initialDocuments = [
  {
    name: "bright-futures-guidelines.pdf",
    source: "horizonfoundation.org",
    status: "Verified",
    date: "Today, 9:41 AM",
  },
  {
    name: "stem-leaders-application.pdf",
    source: "northstareducation.org",
    status: "Processing",
    date: "Today, 9:18 AM",
  },
  {
    name: "community-impact-2026.pdf",
    source: "goodwellpartners.org",
    status: "Needs review",
    date: "Yesterday, 4:32 PM",
  },
];

export default function AdminPage() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploadMessage, setUploadMessage] = useState("");
  const [scholarshipCatalog, setScholarshipCatalog] = useState(scholarships);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState("");

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDocuments((current) => [
      {
        name: file.name,
        source: "Local demo upload",
        status: "Queued",
        date: "Just now",
      },
      ...current,
    ]);
    setUploadMessage(`${file.name} is queued for demo ingestion.`);
    event.target.value = "";
  }

  function markVerified(name: string) {
    setDocuments((current) =>
      current.map((document) =>
        document.name === name ? { ...document, status: "Verified" } : document,
      ),
    );
  }

  function addScholarship(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const provider = String(formData.get("provider") ?? "").trim();
    const amount = String(formData.get("amount") ?? "").trim();
    const category = String(formData.get("category") ?? "Undergraduate");
    if (!name || !provider || !amount) {
      setCatalogMessage("Add a scholarship name, provider, and award amount.");
      return;
    }

    setScholarshipCatalog((current) => [
      {
        id: `sample-${Date.now()}`,
        name,
        provider,
        amount,
        deadline: "Jan 15, 2027",
        daysLeft: 65,
        category,
        match: 0,
        description: "New sample scholarship managed in this frontend demo.",
        color: "from-[#6366f1] to-[#312e81]",
        initials: provider.slice(0, 2).toUpperCase(),
        eligibility: ["Review eligibility details with the provider."],
        benefits: [amount],
        documents: ["Application documents to be confirmed."],
      },
      ...current,
    ]);
    setCatalogMessage("Scholarship added to the sample catalog.");
    setCreateFormOpen(false);
    event.currentTarget.reset();
  }

  function archiveScholarship(id: string) {
    setScholarshipCatalog((current) =>
      current.filter((scholarship) => scholarship.id !== id),
    );
    setCatalogMessage("Scholarship archived from this sample catalog.");
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
            ScholarAI operations
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-[-0.05em] text-[#0f172a] dark:text-white sm:text-[31px]">
            Admin workspace
          </h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            Review sources and keep scholarship information dependable.
          </p>
        </div>
        <Pill tone="green">
          <span className="mr-1.5 size-1.5 rounded-full bg-[#312e81]" /> System
          healthy
        </Pill>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active scholarships",
            value: "248",
            change: "+12 this month",
            icon: ShieldCheck,
            color: "bg-[#e0e7ff] text-[#6366f1]",
          },
          {
            label: "Documents indexed",
            value: "1,842",
            change: "+36 this week",
            icon: FileText,
            color: "bg-[#eef2ff] text-[#312e81]",
          },
          {
            label: "Awaiting verification",
            value: "8",
            change: "3 need attention",
            icon: CircleAlert,
            color: "bg-[#fef3c7] text-[#f59e0b]",
          },
          {
            label: "Ingestion success",
            value: "98.6%",
            change: "Last 30 days",
            icon: Activity,
            color: "bg-[#e0e7ff] text-[#312e81]",
          },
        ].map(({ label, value, change, icon: Icon, color }) => (
          <Surface key={label} className="p-4">
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-medium text-[#8990a2]">{label}</p>
              <span
                className={`grid size-8 place-items-center rounded-lg ${color}`}
              >
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-3 text-[23px] font-extrabold tracking-[-0.04em] text-[#0f172a] dark:text-white">
              {value}
            </p>
            <p className="mt-1 text-[9px] text-[#8a91a1]">{change}</p>
          </Surface>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#0f172a] dark:text-white">
              Scholarship catalog
            </h2>
            <p className="mt-1 text-[10px] text-[#9299aa]">
              Add or archive opportunities in this local demo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateFormOpen((open) => !open);
              setCatalogMessage("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-3 py-2.5 text-[10px] font-bold text-white hover:bg-[#312e81]"
          >
            {createFormOpen ? <X size={13} /> : <Plus size={13} />}
            {createFormOpen ? "Close form" : "Add scholarship"}
          </button>
        </div>
        {createFormOpen && (
          <Surface className="mb-4 p-4 sm:p-5">
            <form
              onSubmit={addScholarship}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.7fr_0.8fr_auto] lg:items-end"
            >
              <label className="block">
                <span className="mb-1.5 block text-[9px] font-semibold text-[#697186]">
                  Scholarship name
                </span>
                <input
                  name="name"
                  required
                  maxLength={120}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[10px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[9px] font-semibold text-[#697186]">
                  Provider
                </span>
                <input
                  name="provider"
                  required
                  maxLength={120}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[10px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[9px] font-semibold text-[#697186]">
                  Award
                </span>
                <input
                  name="amount"
                  required
                  maxLength={40}
                  placeholder="$5,000"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[10px] text-[#0f172a] outline-none placeholder:text-[#b2b7c3] focus:border-[#a5b4fc]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[9px] font-semibold text-[#697186]">
                  Category
                </span>
                <select
                  name="category"
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[10px] text-[#0f172a] outline-none focus:border-[#a5b4fc]"
                >
                  <option>Undergraduate</option>
                  <option>STEM</option>
                  <option>Community</option>
                  <option>First-generation</option>
                </select>
              </label>
              <button
                type="submit"
                className="h-10 rounded-xl bg-[#6366f1] px-4 text-[10px] font-bold text-white hover:bg-[#312e81]"
              >
                Add to catalog
              </button>
            </form>
          </Surface>
        )}
        {catalogMessage && (
          <p
            role="status"
            className="mb-3 text-[10px] font-medium text-[#6366f1]"
          >
            {catalogMessage}
          </p>
        )}
        <Surface className="overflow-hidden">
          <div className="hidden grid-cols-[1.4fr_1fr_0.65fr_0.7fr_auto] gap-3 border-b border-[#ddd6fe] bg-[#f5f3ff] px-4 py-3 text-[9px] font-semibold uppercase tracking-wide text-[#9ba1b0] sm:grid sm:px-5">
            <span>Opportunity</span>
            <span>Provider</span>
            <span>Award</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <div className="divide-y divide-[#ddd6fe]">
            {scholarshipCatalog.map((scholarship) => (
              <div
                key={scholarship.id}
                className="grid gap-2 px-4 py-3.5 sm:grid-cols-[1.4fr_1fr_0.65fr_0.7fr_auto] sm:items-center sm:gap-3 sm:px-5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${scholarship.color} text-[9px] font-bold text-white`}
                  >
                    <GraduationCap size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[10px] font-semibold text-[#0f172a]">
                      {scholarship.name}
                    </span>
                    <span className="mt-0.5 block text-[9px] text-[#969dae]">
                      {scholarship.category} · due {scholarship.deadline}
                    </span>
                  </span>
                </div>
                <p className="truncate text-[9px] text-[#81899c]">
                  {scholarship.provider}
                </p>
                <p className="text-[10px] font-semibold text-[#51586d]">
                  {scholarship.amount}
                </p>
                <div>
                  <Pill tone="green">Active</Pill>
                </div>
                <button
                  type="button"
                  onClick={() => archiveScholarship(scholarship.id)}
                  className="justify-self-start rounded-lg border border-[#ddd6fe] px-2.5 py-1.5 text-[9px] font-semibold text-[#7b8295] hover:border-[#f1d8d1] hover:text-[#bd6959]"
                >
                  Archive
                </button>
              </div>
            ))}
            {scholarshipCatalog.length === 0 && (
              <div className="px-5 py-9 text-center">
                <p className="text-[11px] font-semibold text-[#60677b]">
                  The catalog is empty.
                </p>
                <p className="mt-1 text-[9px] text-[#9198a8]">
                  Add an opportunity to get started.
                </p>
              </div>
            )}
          </div>
        </Surface>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Surface className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ddd6fe] p-4 sm:px-5">
            <div>
              <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
                Document management
              </h2>
              <p className="mt-1 text-[9px] text-[#9299aa]">
                Review, verify, and maintain source documents.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#6366f1] px-3 py-2.5 text-[10px] font-bold text-white hover:bg-[#312e81]">
              <UploadCloud size={14} /> Upload document
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleUpload}
                className="sr-only"
              />
            </label>
          </div>
          {uploadMessage && (
            <p
              role="status"
              className="mx-4 mt-3 rounded-lg bg-[#eef2ff] px-3 py-2 text-[10px] text-[#6366f1] sm:mx-5"
            >
              {uploadMessage}
            </p>
          )}
          <div className="divide-y divide-[#ddd6fe]">
            {documents.map((document) => {
              const statusTone =
                document.status === "Verified"
                  ? "green"
                  : document.status === "Needs review"
                    ? "amber"
                    : "blue";
              return (
                <div
                  key={document.name}
                  className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e0e7ff] text-[#6366f1]">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-[#0f172a]">
                      {document.name}
                    </p>
                    <p className="mt-1 truncate text-[9px] text-[#969dae]">
                      {document.source} · {document.date}
                    </p>
                  </div>
                  <Pill tone={statusTone}>{document.status}</Pill>
                  {document.status !== "Verified" && (
                    <button
                      type="button"
                      onClick={() => markVerified(document.name)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#ddd6fe] px-2.5 py-1.5 text-[9px] font-semibold text-[#687087] hover:border-[#eef2ff] hover:text-[#312e81]"
                    >
                      <Check size={12} /> Verify
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`More options for ${document.name}`}
                    className="rounded-md p-1 text-[#a0a6b5] hover:bg-[#f6f7fa]"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 border-t border-[#ddd6fe] py-3 text-[10px] font-semibold text-[#6366f1] hover:bg-[#e0e7ff]"
          >
            View all documents <ArrowUpRight size={12} />
          </button>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[12px] font-bold text-[#0f172a] dark:text-white">
                  Ingestion activity
                </h2>
                <p className="mt-1 text-[9px] text-[#9299aa]">
                  Document processing status
                </p>
              </div>
              <button
                type="button"
                aria-label="Refresh ingestion status"
                className="rounded-lg p-2 text-[#959bac] hover:bg-[#f5f3ff]"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#5c6478]">
                  Current queue
                </p>
                <Pill tone="blue">2 processing</Pill>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ede9fe]">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#6366f1] to-[#312e81]" />
              </div>
              <p className="mt-2 flex items-center gap-1 text-[9px] text-[#9299aa]">
                <Clock3 size={10} /> Last updated 2 minutes ago
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Documents queued", "4", "text-[#6366f1]"],
                ["Successfully indexed", "32", "text-[#6366f1]"],
                ["Failed, needs review", "1", "text-[#f59e0b]"],
              ].map(([label, count, color]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-[10px]"
                >
                  <span className="text-[#828a9c]">{label}</span>
                  <span className={`font-bold ${color}`}>{count}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#ddd6fe] py-2.5 text-[10px] font-semibold text-[#697186] hover:bg-[#e0e7ff]"
            >
              <ArrowDownToLine size={13} /> Download activity report
            </button>
          </Surface>
          <Surface className="flex items-center gap-3 bg-[#e0e7ff] p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#6366f1]">
              <BadgeCheck size={17} />
            </span>
            <div>
              <p className="text-[10px] font-bold text-[#0f172a]">
                Source quality check
              </p>
              <p className="mt-1 text-[9px] leading-4 text-[#858ca0]">
                All scholarship records should link to a current source.
              </p>
            </div>
            <button
              type="button"
              className="ml-auto shrink-0 text-[9px] font-bold text-[#6366f1] hover:underline"
            >
              Review
            </button>
          </Surface>
        </div>
      </section>
    </div>
  );
}
