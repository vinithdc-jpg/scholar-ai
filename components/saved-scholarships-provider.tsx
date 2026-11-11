"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type SavedScholarshipsContextValue = {
  savedIds: string[];
  toggleSaved: (id: string) => void;
};

const SavedScholarshipsContext = createContext<SavedScholarshipsContextValue | null>(null);

export function SavedScholarshipsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState(["bright-futures", "stem-leaders", "community-impact"]);

  const toggleSaved = useCallback((id: string) => {
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id],
    );
  }, []);

  const value = useMemo(() => ({ savedIds, toggleSaved }), [savedIds, toggleSaved]);
  return <SavedScholarshipsContext.Provider value={value}>{children}</SavedScholarshipsContext.Provider>;
}

export function useSavedScholarships() {
  const context = useContext(SavedScholarshipsContext);
  if (!context) {
    throw new Error("useSavedScholarships must be used within SavedScholarshipsProvider");
  }
  return context;
}
