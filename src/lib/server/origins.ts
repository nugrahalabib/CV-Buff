/**
 * Single source of truth for trusted browser origins (server-only), used by both
 * better-auth (`trustedOrigins`) and `requireUser` (CSRF origin check).
 *
 * Built from BETTER_AUTH_URL + the production domain. localhost is trusted ONLY in
 * development, so a production deployment never treats localhost as same-site.
 */
const isProd = process.env.NODE_ENV === "production";
const PROD_ORIGIN = "https://cv.agentbuff.id";

const origins = new Set<string>();
origins.add(PROD_ORIGIN);

if (process.env.BETTER_AUTH_URL) {
  try {
    origins.add(new URL(process.env.BETTER_AUTH_URL).origin);
  } catch {
    /* ignore malformed BETTER_AUTH_URL */
  }
}

if (!isProd) {
  origins.add("http://localhost:1713");
}

export const TRUSTED_ORIGINS: string[] = Array.from(origins);
export const TRUSTED_ORIGIN_SET: ReadonlySet<string> = new Set(TRUSTED_ORIGINS);
