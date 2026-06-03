import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/proxy/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { searchParams } = new URL(request.url);
          const imageUrl = searchParams.get("url");

          if (!imageUrl) {
            console.error("Parameter URL gambar tidak ada");
            return Response.json({ error: "Parameter URL gambar tidak ada" }, { status: 400 });
          }

          let parsedUrl: URL;
          try {
            parsedUrl = new URL(imageUrl);
          } catch (_error) {
            console.error(`Format URL gambar tidak valid: ${imageUrl}`);
            return Response.json({ error: "Format URL gambar tidak valid" }, { status: 400 });
          }

          if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            console.error(`Protokol URL tidak didukung: ${parsedUrl.protocol}`);
            return Response.json({ error: "Hanya protokol HTTP dan HTTPS yang didukung" }, { status: 400 });
          }

          let response: Response;
          try {
            response = await fetch(imageUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
                Referer: parsedUrl.origin
              }
            });
          } catch (error: any) {
            console.error(`Gagal mengambil gambar: ${error.message || "Kesalahan tidak diketahui"}`);
            return Response.json({ error: `Gagal mengambil gambar: ${error.message || "Kesalahan tidak diketahui"}` }, { status: 500 });
          }

          if (!response.ok) {
            console.error(`Server gambar mengembalikan error: ${response.status} ${response.statusText}`);
            return Response.json({ error: `Gagal mengambil gambar: ${response.status} ${response.statusText}` }, { status: response.status });
          }

          let imageBuffer: ArrayBuffer;
          try {
            imageBuffer = await response.arrayBuffer();
          } catch (error: any) {
            console.error(`Gagal membaca konten gambar: ${error.message || "Kesalahan tidak diketahui"}`);
            return Response.json({ error: `Gagal membaca konten gambar: ${error.message || "Kesalahan tidak diketahui"}` }, { status: 500 });
          }

          if (imageBuffer.byteLength === 0) {
            console.error("Konten gambar kosong");
            return Response.json({ error: "Konten gambar kosong" }, { status: 400 });
          }

          const contentType = response.headers.get("content-type") || "image/jpeg";

          return new Response(imageBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
              "Surrogate-Control": "no-store",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type"
            }
          });
        } catch (error: any) {
          console.error("Error tak tertangani pada image proxy:", error);
          return Response.json({ error: `Terjadi kesalahan saat memproses permintaan gambar: ${error.message || "Kesalahan tidak diketahui"}` }, { status: 500 });
        }
      }
    }
  }
});
