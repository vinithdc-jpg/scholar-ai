"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { Surface } from "@/components/ui";
import { apiRequest } from "@/lib/api/client";

type StudentDocument = {
  id: number;
  title: string;
  document_type: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  page_count: number | null;
  source_url: string | null;
  cloudinary_secure_url: string | null;
  academic_year: string | null;
  version: number | null;
  verification_status: string;
  processing_status: string;
  created_at: string;
};

function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function ProfileDocuments() {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [selected, setSelected] = useState<StudentDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async () => {
    const result = await apiRequest<{ documents: StudentDocument[] }>(
      "/api/documents?limit=100",
    );
    if (!Array.isArray(result.documents)) {
      throw new Error("The document list response is invalid.");
    }
    setDocuments(result.documents);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadDocuments()
        .catch((cause: unknown) => {
          if (active) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Unable to load your documents.",
            );
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadDocuments]);

  async function showDocument(id: number) {
    if (selected?.id === id) {
      setSelected(null);
      return;
    }
    setError("");
    try {
      const result = await apiRequest<{ document: StudentDocument }>(
        `/api/documents/${id}`,
      );
      setSelected(result.document);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load document details.",
      );
    }
  }

  return (
    <section className="mt-5">
      <div className="mb-3">
        <h2 className="text-[15px] font-bold text-[#0f172a] dark:text-white">
          My documents
        </h2>
        <p className="mt-1 text-[10px] text-[#858c9e]">
          Read-only documents currently linked to your account.
        </p>
      </div>
      {error && (
        <p
          className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-[12px] text-rose-700"
          role="alert"
        >
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="text-[11px] text-[#858c9e]" role="status">
          Loading your documents…
        </p>
      ) : documents.length ? (
        <div className="space-y-2">
          {documents.map((document) => {
            const fileUrl = safeUrl(document.cloudinary_secure_url);
            const sourceUrl = safeUrl(document.source_url);
            return (
              <Surface key={document.id} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-[#eef2ff] text-[#312e81]">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-[#0f172a] dark:text-white">
                      {document.title}
                    </p>
                    <p className="mt-1 text-[10px] text-[#8b92a3]">
                      {document.document_type || "Document"} ·{" "}
                      {document.verification_status} ·{" "}
                      {document.processing_status}
                    </p>
                  </div>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-semibold text-[#6366f1] hover:underline"
                    >
                      Open file
                    </a>
                  )}
                  {sourceUrl && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-semibold text-[#6366f1] hover:underline"
                    >
                      Source
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => void showDocument(document.id)}
                    aria-expanded={selected?.id === document.id}
                    className="rounded-lg p-2 text-[#858c9e] hover:bg-[#f5f3ff]"
                    aria-label={`Show details for ${document.title}`}
                  >
                    <ChevronDown
                      size={15}
                      className={
                        selected?.id === document.id ? "rotate-180" : ""
                      }
                    />
                  </button>
                </div>
                {selected?.id === document.id && (
                  <div className="mt-3 grid gap-2 border-t border-[#ddd6fe] pt-3 text-[10px] text-[#747c91] sm:grid-cols-2">
                    <p>File: {selected.original_filename || "Not available"}</p>
                    <p>Type: {selected.mime_type || "Not available"}</p>
                    <p>
                      Academic year: {selected.academic_year || "Not specified"}
                    </p>
                    <p>
                      Pages: {selected.page_count ?? "Not available"} · Version{" "}
                      {selected.version ?? 1}
                    </p>
                  </div>
                )}
              </Surface>
            );
          })}
        </div>
      ) : (
        <Surface className="px-5 py-8 text-center text-[11px] text-[#858c9e]">
          No documents are currently linked to your account.
        </Surface>
      )}
    </section>
  );
}
