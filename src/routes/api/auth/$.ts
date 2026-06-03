import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/server/auth";

/**
 * Catch-all that hands every /api/auth/* request to better-auth.
 * GET  → OAuth callbacks, session reads. POST → sign-in / sign-out.
 */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => auth.handler(request),
      POST: ({ request }: { request: Request }) => auth.handler(request),
    },
  },
});
