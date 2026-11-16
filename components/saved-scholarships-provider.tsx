"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api/client";
import {
  toScholarshipDisplay,
  type ScholarshipRecord,
} from "@/lib/scholarship-display";
import type { Scholarship } from "@/lib/sample-data";

type SavedScholarshipRow = ScholarshipRecord & {
  saved_id: number | string;
  verification_status: string;
};

type SavedScholarshipResponse = {
  scholarships: SavedScholarshipRow[];
};

type SavedScholarshipsContextValue = {
  savedIds: string[];
  savedScholarships: Scholarship[];
  pendingIds: string[];
  isLoading: boolean;
  error: string;
  toggleSaved: (scholarship: Scholarship) => Promise<void>;
};

const SavedScholarshipsContext =
  createContext<SavedScholarshipsContextValue | null>(null);

export function SavedScholarshipsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [entries, setEntries] = useState<
    { savedId: string; scholarship: Scholarship }[]
  >([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSaved = useCallback(async () => {
    const result = await apiRequest<SavedScholarshipResponse>(
      "/api/saved-scholarships?limit=100",
    );
    if (!Array.isArray(result.scholarships)) {
      throw new Error("The saved scholarship response is invalid.");
    }
    setEntries(
      result.scholarships.map((row) => ({
        savedId: String(row.saved_id),
        scholarship: toScholarshipDisplay({
          ...row,
          is_community_submitted: row.verification_status === "pending",
        }),
      })),
    );
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadSaved()
        .catch((cause: unknown) => {
          if (active) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Unable to load saved scholarships.",
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
  }, [loadSaved]);

  const toggleSaved = useCallback(
    async (scholarship: Scholarship) => {
      const scholarshipId = scholarship.id;
      if (pendingIds.includes(scholarshipId)) return;
      setPendingIds((current) => [...current, scholarshipId]);
      setError("");

      try {
        const existing = entries.find(
          (entry) => entry.scholarship.id === scholarshipId,
        );
        if (existing) {
          await apiRequest<{ success: boolean }>(
            `/api/saved-scholarships/${existing.savedId}`,
            { method: "DELETE" },
          );
          setEntries((current) =>
            current.filter((entry) => entry.savedId !== existing.savedId),
          );
        } else {
          const numericId = Number(scholarshipId);
          if (!Number.isSafeInteger(numericId) || numericId < 1) {
            throw new Error("This scholarship cannot be saved yet.");
          }
          const result = await apiRequest<{
            savedScholarship: { id: number | string };
          }>("/api/saved-scholarships", {
            method: "POST",
            body: JSON.stringify({ scholarship_id: numericId }),
          });
          setEntries((current) => [
            ...current,
            {
              savedId: String(result.savedScholarship.id),
              scholarship,
            },
          ]);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to update saved scholarships.",
        );
      } finally {
        setPendingIds((current) =>
          current.filter((id) => id !== scholarshipId),
        );
      }
    },
    [entries, pendingIds],
  );

  const value = useMemo(
    () => ({
      savedIds: entries.map((entry) => entry.scholarship.id),
      savedScholarships: entries.map((entry) => entry.scholarship),
      pendingIds,
      isLoading,
      error,
      toggleSaved,
    }),
    [entries, pendingIds, isLoading, error, toggleSaved],
  );

  return (
    <SavedScholarshipsContext.Provider value={value}>
      {children}
    </SavedScholarshipsContext.Provider>
  );
}

export function useSavedScholarships() {
  const context = useContext(SavedScholarshipsContext);
  if (!context) {
    throw new Error(
      "useSavedScholarships must be used within SavedScholarshipsProvider",
    );
  }
  return context;
}
