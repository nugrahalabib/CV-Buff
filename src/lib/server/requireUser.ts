import { auth } from "./auth";

const TRUSTED_ORIGINS = new Set([
  "http://localhost:1713",
  "https://cv.agentbuff.id",
]);

/**
 * Server-side auth boundary. Call at the top of any sensitive API handler.
 *
 * Throws a `Response` (403 forged origin / 401 unauthenticated) so handlers can do:
 *   try { await requireUser(request); } catch (r) { return r as Response; }
 *
 * Returns the authenticated user. ALWAYS scope any per-user data access to `user.id`
 * derived here — never trust a user id from the request body or query.
 */
export async function requireUser(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !TRUSTED_ORIGINS.has(origin)) {
    throw new Response("Forbidden origin", { status: 403 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    throw new Response(
      JSON.stringify({ error: { message: "Unauthorized — silakan masuk dulu." } }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return session.user;
}
