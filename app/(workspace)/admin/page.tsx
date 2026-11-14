"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Archive, Check, Pencil, Plus, UploadCloud, X } from "lucide-react";
import { Pill, Surface } from "@/components/ui";
import { useWorkspaceRole } from "@/components/workspace-shell";
import { auth } from "@/lib/firebase";

type AdminScholarship = {
  id: number | string;
  name: string;
  provider: string;
  description: string;
  amount: number | string | null;
  application_deadline: string | null;
  official_source_url: string | null;
  status: "draft" | "published" | "archived";
  verification_status: "pending" | "verified" | "rejected";
};

type AdminDocument = {
  id: number | string;
  title: string;
  document_type: string;
  cloudinary_secure_url: string;
  verification_status: "pending" | "verified" | "rejected";
  processing_status: string;
};

type AdminAccount = {
  id: number | string;
  email: string;
  full_name: string | null;
  role: "content_admin" | "super_admin";
};

async function adminRequest(path: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in again to continue.");

  const idToken = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(path, { ...init, headers, cache: "no-store" });
}

async function responseError<T extends Record<string, unknown> = Record<string, unknown>>(
  response: Response,
): Promise<T & { error?: string }> {
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(result.error ?? "The request could not be completed.");
  }
  return result;
}

async function fetchAdminData(isSuperAdmin: boolean) {
  const [scholarshipResponse, documentResponse, adminResponse] =
    await Promise.all([
      adminRequest("/api/admin/scholarships?limit=100"),
      adminRequest("/api/admin/documents?limit=30"),
      isSuperAdmin ? adminRequest("/api/admin/users") : Promise.resolve(null),
    ]);
  const scholarshipResult = await responseError<{
    scholarships?: AdminScholarship[];
  }>(scholarshipResponse);
  const documentResult = await responseError<{
    documents?: AdminDocument[];
  }>(documentResponse);
  const adminResult = adminResponse
    ? await responseError<{ admins?: AdminAccount[] }>(adminResponse)
    : null;

  if (!Array.isArray(scholarshipResult.scholarships)) {
    throw new Error("The scholarship list response is invalid.");
  }
  if (!Array.isArray(documentResult.documents)) {
    throw new Error("The document list response is invalid.");
  }
  if (isSuperAdmin && (!adminResult || !Array.isArray(adminResult.admins))) {
    throw new Error("The admin account list response is invalid.");
  }

  return {
    scholarships: scholarshipResult.scholarships,
    documents: documentResult.documents,
    admins: adminResult?.admins ?? [],
  };
}

export default function AdminPage() {
  const { role, isRoleLoading } = useWorkspaceRole();
  const isAdmin = role === "content_admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  const [scholarships, setScholarships] = useState<AdminScholarship[]>([]);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminScholarship | null>(null);

  const loadAdminData = useCallback(async () => {
    try {
      const data = await fetchAdminData(isSuperAdmin);
      setScholarships(data.scholarships);
      setDocuments(data.documents);
      setAdmins(data.admins);
      setIsLoading(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load admin data.",
      );
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    async function load() {
      try {
        const data = await fetchAdminData(isSuperAdmin);
        if (!active) return;
        setScholarships(data.scholarships);
        setDocuments(data.documents);
        setAdmins(data.admins);
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load admin data.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [isAdmin, isSuperAdmin]);

  async function handleScholarshipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const formData = new FormData(event.currentTarget);
      const amountValue = String(formData.get("amount") ?? "").trim();
      const body = {
        name: String(formData.get("name") ?? "").trim(),
        provider: String(formData.get("provider") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim(),
        amount: amountValue ? Number(amountValue) : null,
        application_deadline:
          String(formData.get("application_deadline") ?? "").trim() || null,
        official_source_url:
          String(formData.get("official_source_url") ?? "").trim() || null,
        status: String(formData.get("status") ?? "draft"),
        verification_status: String(
          formData.get("verification_status") ?? "pending",
        ),
      };

      if (body.amount !== null && !Number.isFinite(body.amount)) {
        throw new Error("Enter a valid award amount.");
      }

      const response = await adminRequest(
        editing ? `/api/scholarships/${editing.id}` : "/api/scholarships",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(body),
        },
      );
      await responseError(response);
      setStatusMessage(editing ? "Scholarship updated." : "Scholarship added.");
      setEditing(null);
      setFormOpen(false);
      await loadAdminData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save scholarship.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function archiveScholarship(scholarship: AdminScholarship) {
    setErrorMessage("");
    setStatusMessage("");
    try {
      const response = await adminRequest(
        `/api/scholarships/${scholarship.id}`,
        { method: "DELETE" },
      );
      await responseError(response);
      setStatusMessage("Scholarship archived.");
      await loadAdminData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to archive scholarship.",
      );
    }
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    const form = event.currentTarget;

    try {
      const values = new FormData(form);
      const file = values.get("file");
      if (!(file instanceof File)) {
        throw new Error("Select a PDF file to upload.");
      }

      const body = new FormData();
      body.set("file", file);
      body.set("title", file.name.slice(0, 255));
      body.set("document_type", "scholarship_source");
      const scholarshipId = String(values.get("scholarship_id") ?? "");
      if (scholarshipId) body.set("scholarship_id", scholarshipId);

      const response = await adminRequest("/api/documents/upload", {
        method: "POST",
        body,
      });
      await responseError(response);
      setStatusMessage("Scholarship source document uploaded.");
      form.reset();
      await loadAdminData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to upload document.",
      );
    }
  }

  async function verifyDocument(document: AdminDocument) {
    setErrorMessage("");
    setStatusMessage("");
    try {
      const response = await adminRequest(
        `/api/admin/documents/${document.id}/verify`,
        {
          method: "PATCH",
          body: JSON.stringify({ verification_status: "verified" }),
        },
      );
      await responseError(response);
      setStatusMessage("Document marked as verified.");
      await loadAdminData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to verify document.",
      );
    }
  }

  async function createAdminAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setStatusMessage("");
    const form = event.currentTarget;

    try {
      const formData = new FormData(form);
      const response = await adminRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          full_name: formData.get("full_name"),
          password: formData.get("password"),
        }),
      });
      await responseError(response);
      setStatusMessage(
        "Admin account created. Share its temporary password securely.",
      );
      form.reset();
      await loadAdminData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to grant admin access.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function revokeAdminAccess(admin: AdminAccount) {
    setErrorMessage("");
    setStatusMessage("");
    try {
      const response = await adminRequest(`/api/admin/users/${admin.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: "student" }),
      });
      await responseError(response);
      setStatusMessage(`Admin access removed for ${admin.email}.`);
      await loadAdminData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to revoke admin access.",
      );
    }
  }

  if (isRoleLoading) {
    return (
      <p className="text-sm text-[#858c9e]" role="status">
        Verifying admin access…
      </p>
    );
  }

  if (!isAdmin) {
    return (
      <Surface className="p-6">
        <p className="text-sm text-rose-600" role="alert">
          You do not have permission to access the admin workspace.
        </p>
      </Surface>
    );
  }

  const publishedCount = scholarships.filter(
    (scholarship) => scholarship.status === "published",
  ).length;
  const pendingCount = scholarships.filter(
    (scholarship) => scholarship.verification_status === "pending",
  ).length;
  const draftCount = scholarships.filter(
    (scholarship) => scholarship.status === "draft",
  ).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6366f1]">
            ScholarAI operations
          </p>
          <h1 className="mt-1 text-[27px] font-extrabold tracking-tighter text-[#0f172a] dark:text-white sm:text-[31px]">
            Admin workspace
          </h1>
          <p className="mt-2 text-[12px] text-[#858c9e]">
            Manage scholarship information and verify its source documents.
          </p>
        </div>
        <Pill tone="blue">
          {role === "super_admin" ? "Super Admin" : "Admin"}
        </Pill>
      </div>

      {errorMessage && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {errorMessage}
        </p>
      )}
      {statusMessage && (
        <p className="rounded-xl bg-[#eef2ff] px-4 py-3 text-sm text-[#4338ca]" role="status">
          {statusMessage}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Published scholarships", value: publishedCount },
          { label: "Awaiting verification", value: pendingCount },
          { label: "Draft scholarships", value: draftCount },
        ].map(({ label, value }) => (
          <Surface key={label} className="p-4">
            <p className="text-[11px] font-medium text-[#8990a2]">{label}</p>
            <p className="mt-3 text-[23px] font-extrabold text-[#0f172a] dark:text-white">
              {isLoading ? "…" : value}
            </p>
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
              Add, edit, publish, and archive scholarship records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen((open) => !open);
              setErrorMessage("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-3 py-2.5 text-[10px] font-bold text-white hover:bg-[#312e81]"
          >
            {formOpen ? <X size={13} /> : <Plus size={13} />}
            {formOpen ? "Close form" : "Add scholarship"}
          </button>
        </div>

        {formOpen && (
          <Surface className="mb-4 p-4 sm:p-5">
            <form
              key={editing?.id ?? "new-scholarship"}
              onSubmit={handleScholarshipSubmit}
              className="grid gap-3 sm:grid-cols-2"
            >
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Scholarship name
                </span>
                <input
                  name="name"
                  required
                  maxLength={255}
                  defaultValue={editing?.name}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Provider
                </span>
                <input
                  name="provider"
                  required
                  maxLength={255}
                  defaultValue={editing?.provider}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Award amount
                </span>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editing?.amount ?? ""}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Application deadline
                </span>
                <input
                  name="application_deadline"
                  type="date"
                  defaultValue={editing?.application_deadline?.slice(0, 10) ?? ""}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Description
                </span>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editing?.description}
                  className="workspace-input w-full rounded-xl border border-[#ddd6fe] bg-white px-3 py-2 text-[11px] text-[#0f172a]"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Official source URL
                </span>
                <input
                  name="official_source_url"
                  type="url"
                  defaultValue={editing?.official_source_url ?? ""}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Publication status
                </span>
                <select
                  name="status"
                  defaultValue={editing?.status ?? "draft"}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-semibold text-[#697186]">
                  Verification status
                </span>
                <select
                  name="verification_status"
                  defaultValue={editing?.verification_status ?? "pending"}
                  className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="h-10 rounded-xl bg-[#6366f1] px-4 text-[10px] font-bold text-white hover:bg-[#312e81] disabled:opacity-60 sm:col-span-2 sm:justify-self-end"
              >
                {isSaving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Add scholarship"}
              </button>
            </form>
          </Surface>
        )}

        <Surface className="overflow-hidden">
          {isLoading ? (
            <p className="p-5 text-sm text-[#858c9e]" role="status">
              Loading scholarships…
            </p>
          ) : scholarships.length ? (
            <div className="divide-y divide-[#ddd6fe]">
              {scholarships.map((scholarship) => (
                <div
                  key={scholarship.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[#0f172a] dark:text-white">
                      {scholarship.name}
                    </p>
                    <p className="mt-1 text-[10px] text-[#858c9e]">
                      {scholarship.provider}
                      {scholarship.amount !== null
                        ? ` · ${scholarship.amount}`
                        : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[10px] text-[#858c9e]">
                      {scholarship.description}
                    </p>
                  </div>
                  <Pill
                    tone={
                      scholarship.status === "published"
                        ? "green"
                        : scholarship.status === "archived"
                          ? "amber"
                          : "blue"
                    }
                  >
                    {scholarship.status}
                  </Pill>
                  <Pill
                    tone={
                      scholarship.verification_status === "verified"
                        ? "green"
                        : scholarship.verification_status === "rejected"
                          ? "amber"
                          : "blue"
                    }
                  >
                    {scholarship.verification_status}
                  </Pill>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(scholarship);
                      setFormOpen(true);
                      setErrorMessage("");
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#ddd6fe] px-2.5 py-1.5 text-[10px] font-semibold text-[#6366f1]"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  {scholarship.status !== "archived" && (
                    <button
                      type="button"
                      onClick={() => archiveScholarship(scholarship)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#ddd6fe] px-2.5 py-1.5 text-[10px] font-semibold text-[#7b8295]"
                    >
                      <Archive size={12} /> Archive
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm text-[#858c9e]">
              No scholarship records yet.
            </p>
          )}
        </Surface>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Surface className="p-4 sm:p-5">
          <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
            Upload scholarship source
          </h2>
          <p className="mt-1 text-[10px] text-[#9299aa]">
            Upload a PDF and optionally attach it to a scholarship record.
          </p>
          <form onSubmit={uploadDocument} className="mt-4 space-y-3">
            <input
              name="file"
              type="file"
              accept=".pdf,application/pdf"
              required
              className="block w-full text-[11px] text-[#697186]"
            />
            <select
              name="scholarship_id"
              defaultValue=""
              className="workspace-input h-10 w-full rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
            >
              <option value="">Attach to a scholarship (optional)</option>
              {scholarships.map((scholarship) => (
                <option key={scholarship.id} value={scholarship.id}>
                  {scholarship.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-3 py-2.5 text-[10px] font-bold text-white"
            >
              <UploadCloud size={14} /> Upload PDF
            </button>
          </form>
        </Surface>

        <Surface className="overflow-hidden">
          <div className="border-b border-[#ddd6fe] p-4">
            <h2 className="text-[13px] font-bold text-[#0f172a] dark:text-white">
              Source documents
            </h2>
          </div>
          {documents.length ? (
            <div className="divide-y divide-[#ddd6fe]">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <a
                    href={document.cloudinary_secure_url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#6366f1] hover:underline"
                  >
                    {document.title}
                  </a>
                  <Pill
                    tone={
                      document.verification_status === "verified"
                        ? "green"
                        : document.verification_status === "rejected"
                          ? "amber"
                          : "blue"
                    }
                  >
                    {document.verification_status}
                  </Pill>
                  {document.verification_status === "pending" && (
                    <button
                      type="button"
                      onClick={() => verifyDocument(document)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#ddd6fe] px-2 py-1 text-[10px] font-semibold text-[#6366f1]"
                    >
                      <Check size={12} /> Verify
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="p-4 text-[11px] text-[#858c9e]">
              No source documents uploaded.
            </p>
          )}
        </Surface>
      </section>

      {isSuperAdmin && (
        <section>
          <div className="mb-4">
            <h2 className="text-[14px] font-bold text-[#0f172a] dark:text-white">
              Admin accounts
            </h2>
            <p className="mt-1 text-[10px] text-[#9299aa]">
              Create Firebase admin accounts or revoke existing admin access.
              Share temporary passwords securely and never reuse passwords.
            </p>
          </div>
          <Surface className="p-4 sm:p-5">
            <form
              onSubmit={createAdminAccount}
              className="grid gap-3 sm:grid-cols-2"
            >
              <input
                name="full_name"
                type="text"
                required
                maxLength={255}
                placeholder="Admin name"
                className="workspace-input h-10 min-w-0 rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
              />
              <input
                name="email"
                type="email"
                required
                maxLength={255}
                placeholder="admin@example.com"
                className="workspace-input h-10 min-w-0 flex-1 rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a]"
              />
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Temporary password (12+ characters)"
                className="workspace-input h-10 min-w-0 rounded-xl border border-[#ddd6fe] bg-white px-3 text-[11px] text-[#0f172a] sm:col-span-2"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-[#6366f1] px-4 py-2 text-[10px] font-bold text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-end"
              >
                {isSaving ? "Creating…" : "Create admin account"}
              </button>
            </form>
            <div className="mt-4 divide-y divide-[#ddd6fe]">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-[#0f172a] dark:text-white">
                      {admin.full_name ?? admin.email}
                    </p>
                    <p className="truncate text-[10px] text-[#858c9e]">
                      {admin.email}
                    </p>
                  </div>
                  <Pill tone={admin.role === "super_admin" ? "green" : "blue"}>
                    {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                  </Pill>
                  {admin.role === "content_admin" && (
                    <button
                      type="button"
                      onClick={() => revokeAdminAccess(admin)}
                      className="rounded-lg border border-[#ddd6fe] px-2.5 py-1.5 text-[10px] font-semibold text-[#7b8295]"
                    >
                      Revoke access
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Surface>
        </section>
      )}
    </div>
  );
}
