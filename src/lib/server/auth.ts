import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { genericOAuth } from "better-auth/plugins";
import { pool } from "./db";
import { socialProviders } from "./authProviders";
import { TRUSTED_ORIGINS } from "./origins";

/**
 * Server-only auth instance (better-auth).
 *
 * This shared SQLite connection (src/lib/server/db.ts) also holds the per-user
 * `resume` table — CV rows are always scoped to user.id. The user's AI API keys are
 * NOT stored server-side (they stay in the browser).
 *
 * SSO "colokan": OAuth providers live in ./authProviders; OIDC/OAuth2 providers
 * can be added to the genericOAuth({ config: [...] }) slot below — no schema change.
 */
/**
 * Session-signing secret. Falls back to an insecure constant ONLY in development; in
 * production a missing BETTER_AUTH_SECRET fails fast (crash on boot) instead of silently
 * signing every session cookie with a publicly-known value (which would allow forgery).
 */
const AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("BETTER_AUTH_SECRET is required in production");
      })()
    : "dev-insecure-secret-change-in-production");

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:1713",
  secret: AUTH_SECRET,
  trustedOrigins: TRUSTED_ORIGINS,

  socialProviders,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // rolling refresh after 1 day of use
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min signed cache to cut DB hits
  },

  advanced: {
    // Secure cookies ONLY in production — forcing them on http://localhost:1713 breaks login.
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  plugins: [
    // SSO colokan: future OIDC/OAuth2 providers go in this config array.
    genericOAuth({ config: [] }),
    // MUST be last: bridges Set-Cookie through TanStack Start's server entry.
    tanstackStartCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
