import { Pool } from "pg";

/**
 * Shared Postgres connection pool (server-only) used by BOTH better-auth and the
 * per-user resume storage. The CV `resume` table lives here (full ResumeData JSON),
 * scoped to `user_id`. CV content reaches a device only on download/export. The user's
 * AI API keys are NOT stored here (they stay in the browser).
 */
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://cvbuff_user:cvbuff@localhost:5432/cvbuff";

export const pool = new Pool({ connectionString });

// Idempotent schema for the `resume` table (better-auth's own tables are created by
// the migrate CLI). Cached so it only runs once; reset on failure so it can retry.
let schemaReady: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS resume (
          id          TEXT PRIMARY KEY,
          user_id     TEXT NOT NULL,
          title       TEXT,
          data        TEXT NOT NULL,
          created_at  TIMESTAMPTZ DEFAULT now(),
          updated_at  TIMESTAMPTZ DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_resume_user_id ON resume (user_id, updated_at DESC);
      `)
      .then(() => undefined)
      .catch((e) => {
        schemaReady = null;
        throw e;
      });
  }
  return schemaReady;
}
