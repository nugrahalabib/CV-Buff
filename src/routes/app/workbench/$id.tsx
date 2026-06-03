import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import WorkbenchPage from "@/app/app/workbench/[id]/page";
import { useResumeStore } from "@/store/useResumeStore";

export const Route = createFileRoute("/app/workbench/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  ssr: false,
  component: WorkbenchRoutePage
});

function WorkbenchRoutePage() {
  const { id } = Route.useParams();
  const setActiveResume = useResumeStore((s) => s.setActiveResume);
  const ensureResumeLoaded = useResumeStore((s) => s.ensureResumeLoaded);
  const activeResume = useResumeStore((s) => s.activeResume);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Already loaded (e.g. navigated from the dashboard) → activate immediately, no flash.
    if (useResumeStore.getState().resumes[id]) {
      setActiveResume(id);
      return;
    }
    // Deep-link / hard refresh → fetch this resume from the server.
    (async () => {
      const r = await ensureResumeLoaded(id);
      if (cancelled) return;
      if (!r) {
        setNotFound(true);
        return;
      }
      setActiveResume(id);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, ensureResumeLoaded, setActiveResume]);

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        CV tidak ditemukan
      </div>
    );
  }
  if (!activeResume || activeResume.id !== id) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Memuat…
      </div>
    );
  }
  return <WorkbenchPage />;
}
