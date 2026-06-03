import { pool, ensureSchema } from "./db";
import type { ResumeData } from "@/types/resume";

/**
 * Per-user resume queries (Postgres). EVERY query is scoped to user_id so no user can
 * ever read or write another user's CV.
 */
export async function listResumes(userId: string): Promise<ResumeData[]> {
  await ensureSchema();
  const { rows } = await pool.query<{ data: string }>(
    "SELECT data FROM resume WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId]
  );
  return rows.map((r) => JSON.parse(r.data) as ResumeData);
}

export async function getResume(
  userId: string,
  id: string
): Promise<ResumeData | null> {
  await ensureSchema();
  const { rows } = await pool.query<{ data: string }>(
    "SELECT data FROM resume WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return rows[0] ? (JSON.parse(rows[0].data) as ResumeData) : null;
}

/** Owner user_id of a resume id, or undefined if it doesn't exist. */
export async function ownerOf(id: string): Promise<string | undefined> {
  await ensureSchema();
  const { rows } = await pool.query<{ user_id: string }>(
    "SELECT user_id FROM resume WHERE id = $1",
    [id]
  );
  return rows[0]?.user_id;
}

export async function upsertResume(
  userId: string,
  resume: ResumeData
): Promise<ResumeData> {
  await ensureSchema();
  const now = new Date().toISOString();
  const r: ResumeData = {
    ...resume,
    createdAt: resume.createdAt || now,
    updatedAt: now,
  };
  // ON CONFLICT ... WHERE resume.user_id = $2 → a foreign id collision updates 0 rows
  // (no overwrite, no cross-user leak).
  await pool.query(
    `INSERT INTO resume (id, user_id, title, data, created_at, updated_at)
     VALUES ($1, $2, $3, $4, now(), now())
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title, data = EXCLUDED.data, updated_at = now()
     WHERE resume.user_id = $2`,
    [r.id, userId, r.title ?? null, JSON.stringify(r)]
  );
  return r;
}

export async function deleteResume(userId: string, id: string): Promise<void> {
  await ensureSchema();
  await pool.query("DELETE FROM resume WHERE id = $1 AND user_id = $2", [
    id,
    userId,
  ]);
}
