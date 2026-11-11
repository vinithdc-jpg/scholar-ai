import { Suspense, type ReactNode } from "react";
import { SavedScholarshipsProvider } from "@/components/saved-scholarships-provider";
import WorkspaceShell from "@/components/workspace-shell";
import WorkspaceLoading from "./loading";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <SavedScholarshipsProvider>
      <Suspense fallback={<WorkspaceLoading />}>
        <WorkspaceShell>{children}</WorkspaceShell>
      </Suspense>
    </SavedScholarshipsProvider>
  );
}
