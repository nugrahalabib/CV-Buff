import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/requireUser";
import { listResumes, upsertResume } from "@/lib/server/resumeRepo";
import type { ResumeData } from "@/types/resume";

/** Collection endpoint: GET = list the caller's resumes, POST = create (upsert). */
export const Route = createFileRoute("/api/resumes")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        let user;
        try {
          user = await requireUser(request);
        } catch (r) {
          return r as Response;
        }
        try {
          return Response.json({ resumes: await listResumes(user.id) });
        } catch (error) {
          console.error("List resumes error:", error);
          return Response.json(
            { error: { message: "Gagal memuat daftar CV." } },
            { status: 500 }
          );
        }
      },
      POST: async ({ request }: { request: Request }) => {
        let user;
        try {
          user = await requireUser(request);
        } catch (r) {
          return r as Response;
        }
        try {
          const body = (await request.json()) as { resume?: ResumeData } | ResumeData;
          const incoming =
            (body as { resume?: ResumeData }).resume ?? (body as ResumeData);
          if (!incoming?.id) {
            return Response.json(
              { error: { message: "Body harus berisi resume dengan id." } },
              { status: 400 }
            );
          }
          return Response.json(
            { resume: await upsertResume(user.id, incoming) },
            { status: 201 }
          );
        } catch (error) {
          console.error("Create resume error:", error);
          return Response.json(
            { error: { message: "Gagal menyimpan CV." } },
            { status: 500 }
          );
        }
      },
    },
  },
});
