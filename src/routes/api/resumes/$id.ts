import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/requireUser";
import {
  getResume,
  upsertResume,
  deleteResume,
  ownerOf,
} from "@/lib/server/resumeRepo";
import type { ResumeData } from "@/types/resume";

/** Version-robust id extraction (mirrors api/proxy/image.ts — does not rely on handler `params`). */
const getId = (request: Request): string =>
  decodeURIComponent(
    new URL(request.url).pathname.split("/").filter(Boolean).pop() || ""
  );

/** Item endpoint: GET one, PUT update (upsert), DELETE — all scoped to the caller. */
export const Route = createFileRoute("/api/resumes/$id")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        let user;
        try {
          user = await requireUser(request);
        } catch (r) {
          return r as Response;
        }
        const id = getId(request);
        const resume = await getResume(user.id, id);
        if (!resume) {
          const owner = await ownerOf(id);
          if (!owner)
            return Response.json(
              { error: { message: "CV tidak ditemukan." } },
              { status: 404 }
            );
          return Response.json(
            { error: { message: "Akses ditolak." } },
            { status: 403 }
          );
        }
        return Response.json({ resume });
      },
      PUT: async ({ request }: { request: Request }) => {
        let user;
        try {
          user = await requireUser(request);
        } catch (r) {
          return r as Response;
        }
        const id = getId(request);
        try {
          const body = (await request.json()) as { resume?: ResumeData } | ResumeData;
          const incoming =
            (body as { resume?: ResumeData }).resume ?? (body as ResumeData);
          if (!incoming || typeof incoming !== "object") {
            return Response.json(
              { error: { message: "Body harus berisi resume." } },
              { status: 400 }
            );
          }
          const owner = await ownerOf(id);
          if (owner && owner !== user.id) {
            return Response.json(
              { error: { message: "Akses ditolak." } },
              { status: 403 }
            );
          }
          return Response.json({
            resume: await upsertResume(user.id, { ...incoming, id }),
          });
        } catch (error) {
          console.error("Update resume error:", error);
          return Response.json(
            { error: { message: "Gagal memperbarui CV." } },
            { status: 500 }
          );
        }
      },
      DELETE: async ({ request }: { request: Request }) => {
        let user;
        try {
          user = await requireUser(request);
        } catch (r) {
          return r as Response;
        }
        const id = getId(request);
        const owner = await ownerOf(id);
        if (owner && owner !== user.id) {
          return Response.json(
            { error: { message: "Akses ditolak." } },
            { status: 403 }
          );
        }
        await deleteResume(user.id, id);
        return Response.json({ success: true });
      },
    },
  },
});
