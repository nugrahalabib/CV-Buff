import { BUILTIN_PROVIDERS } from "@/config/ai/builtin";
import { assertPublicHttpUrl } from "./ssrfGuard";

const BUILTIN_ENDPOINT_BY_ID = new Map(
  BUILTIN_PROVIDERS.map((p) => [p.id, p.endpoint] as const)
);

function deny(message: string): never {
  throw new Response(JSON.stringify({ error: { message } }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Resolve a SAFE upstream endpoint for an AI provider request (anti-SSRF).
 *
 * - Built-in ids (openai/claude/gemini) ALWAYS use the server-known endpoint; the body's
 *   `endpoint` is ignored, so it cannot be repointed at an internal host.
 * - Custom providers must pass the SSRF guard (host must NOT resolve to a private /
 *   loopback / link-local / reserved address). http + https are allowed for reachable
 *   public hosts; https is recommended since the user's API key travels to that host.
 *
 * Throws a 400 `Response` for a disallowed custom endpoint (handlers: `catch (r) { return r as Response }`).
 */
export async function resolveProviderEndpoint(
  providerId: string,
  requestedEndpoint: string
): Promise<string> {
  const known = BUILTIN_ENDPOINT_BY_ID.get(providerId);
  if (known) return known;

  const ep = (requestedEndpoint || "").trim();
  if (!ep) deny("Endpoint provider tidak boleh kosong");

  let url: URL;
  try {
    url = await assertPublicHttpUrl(ep);
  } catch {
    deny("Endpoint provider tidak diizinkan (host internal/privat ditolak)");
  }
  return url.toString().replace(/\/+$/, "");
}
