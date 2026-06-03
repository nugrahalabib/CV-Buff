import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useResumeStore } from "@/store/useResumeStore";

/**
 * Single auth gate for ALL /app/* routes (dashboard, workbench, preview-template).
 *
 * These routes are `ssr:false`, so the session check runs client-side — this is a
 * UX gate (no flash of protected shell). The REAL security boundary is `requireUser()`
 * on the server APIs and the fact that CV data lives only in the user's own browser.
 */
export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppGuard,
});

function AppGuard() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const loadResumes = useResumeStore((s) => s.loadResumes);
  const didLoad = useRef(false);

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: "/login" });
    }
  }, [isPending, session, navigate]);

  // Pull the signed-in user's resumes from the server once per authenticated entry.
  useEffect(() => {
    if (!isPending && session && !didLoad.current) {
      didLoad.current = true;
      void loadResumes();
    }
  }, [isPending, session, loadResumes]);

  if (isPending) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Memuat…
      </div>
    );
  }

  if (!session) return null; // redirecting; render nothing to avoid a protected-shell flash

  return <Outlet />;
}
