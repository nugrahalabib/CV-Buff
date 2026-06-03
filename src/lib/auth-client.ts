import { createAuthClient } from "better-auth/react";

/**
 * Browser auth client. No React provider is required — the hooks work anywhere.
 * Same-origin (no baseURL): it talks to /api/auth/* on the current host.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, useSession, getSession } = authClient;
