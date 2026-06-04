import { auth } from "./auth";
import { TRUSTED_ORIGIN_SET } from "./origins";

/**
 * Server-side auth boundary. Call at the top of any sensitive API handler.
 *
 * Throws a `Response` (403 forged origin / 401 unauthenticated) so handlers can do:
 *   try { await requireUser(request); } catch (r) { return r as Response; }
 *
 * CSRF: for state-changing methods (POST/PUT/DELETE/PATCH) the request MUST carry a
 * trusted Origin (or, if absent, a trusted Referer) — a missing Origin is treated as
 * untrusted (fail-closed), so a cross-site form can't drive an authenticated mutation
 * even if the cookie policy ever loosens.
 *
 * Returns the authenticated user. ALWAYS scope any per-user data access to `user.id`
 * derived here — never trust a user id from the request body or query.
 */
export async function requireUser(request: Request) {
  const method = request.method.toUpperCase();
  const isUnsafe =
    method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  const origin = request.headers.get("origin");

  if (origin) {
    if (!TRUSTED_ORIGIN_SET.has(origin)) {
      throw new Response("Forbidden origin", { status: 403 });
    }
  } else if (isUnsafe) {
    // State-changing request with no Origin header — fail closed unless a trusted Referer.
    const referer = request.headers.get("referer") || "";
    const refOk = [...TRUSTED_ORIGIN_SET].some(
      (o) => referer === o || referer.startsWith(o + "/")
    );
    if (!refOk) {
      throw new Response("Forbidden origin", { status: 403 });
    }
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
