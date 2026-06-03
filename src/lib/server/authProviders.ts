import type { BetterAuthOptions } from "better-auth";

/**
 * Identity-provider registry — the single source of truth for which login providers
 * are enabled. This is the "colokan SSO": adding a provider later = add one entry here
 * (+ its env vars + a sign-in button). No database change is ever needed — every provider
 * becomes an `account` row keyed by `providerId`.
 *
 * Google is enabled automatically once GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set
 * (so the app still builds / migrates before credentials are configured).
 */
const hasGoogle = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {
  ...(hasGoogle
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          // force the Google account chooser on every login
          prompt: "select_account",
        },
      }
    : {}),

  // ────────────────────────────────────────────────────────────────────────
  // FUTURE PROVIDERS (the SSO "colokan"). Uncomment, add env vars, register the
  // redirect URI in the provider console, and add a sign-in button that calls
  // signIn.social({ provider: "<id>" }). No migration required.
  //
  // github: {
  //   clientId: process.env.GITHUB_CLIENT_ID as string,
  //   clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  // },
  // microsoft: {
  //   clientId: process.env.MICROSOFT_CLIENT_ID as string,
  //   clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
  // },
};
