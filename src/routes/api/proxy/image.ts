import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/requireUser";
import { assertPublicHttpUrl } from "@/lib/server/ssrfGuard";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const FETCH_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

/**
 * Same-origin image proxy for avatar/photo URLs. Authenticated + SSRF-guarded:
 * the URL host must resolve to a public address (no loopback/private/link-local),
 * each redirect hop is re-validated, the body is size-capped, and errors are generic
 * (never echo upstream details — prevents blind-SSRF port probing).
 */
export const Route = createFileRoute("/api/proxy/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireUser(request);
        } catch (r) {
          return r as Response;
        }

        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get("url");
        if (!imageUrl) {
          return Response.json({ error: "Parameter URL gambar tidak ada" }, { status: 400 });
        }

        let safeUrl: URL;
        try {
          safeUrl = await assertPublicHttpUrl(imageUrl);
        } catch {
          return Response.json({ error: "URL gambar tidak diizinkan" }, { status: 400 });
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
          let current = safeUrl;
          let response: Response | null = null;

          for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
            const res = await fetch(current.toString(), {
              redirect: "manual",
              signal: controller.signal,
              headers: {
                "User-Agent": "CV-Buff-ImageProxy/1.0",
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
              },
            });

            if (res.status >= 300 && res.status < 400) {
              const loc = res.headers.get("location");
              if (!loc) return Response.json({ error: "Gagal mengambil gambar" }, { status: 502 });
              // Re-validate every redirect hop against the SSRF guard.
              current = await assertPublicHttpUrl(new URL(loc, current).toString());
              continue;
            }
            response = res;
            break;
          }

          if (!response) {
            return Response.json({ error: "Terlalu banyak pengalihan" }, { status: 502 });
          }
          if (!response.ok) {
            return Response.json({ error: "Gagal mengambil gambar" }, { status: 502 });
          }

          const contentType = response.headers.get("content-type") || "application/octet-stream";
          if (!contentType.startsWith("image/")) {
            return Response.json({ error: "Konten bukan gambar" }, { status: 415 });
          }
          const declaredLen = Number(response.headers.get("content-length") || "0");
          if (declaredLen && declaredLen > MAX_BYTES) {
            return Response.json({ error: "Gambar terlalu besar" }, { status: 413 });
          }

          const buffer = await response.arrayBuffer();
          if (buffer.byteLength === 0) {
            return Response.json({ error: "Konten gambar kosong" }, { status: 400 });
          }
          if (buffer.byteLength > MAX_BYTES) {
            return Response.json({ error: "Gambar terlalu besar" }, { status: 413 });
          }

          return new Response(buffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch {
          return Response.json({ error: "Gagal mengambil gambar" }, { status: 502 });
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
