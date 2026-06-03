import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/requireUser";
import type { ProviderProtocol } from "@/config/ai/types";
import { formatGeminiErrorMessage, getGeminiModelInstance } from "@/lib/server/gemini";
import { callAnthropic, formatAnthropicErrorMessage } from "@/lib/server/anthropic";

interface ProviderPayload {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  endpoint: string;
  customHeaders?: Record<string, string>;
  authHeader?: "bearer" | "x-api-key" | "x-goog-api-key" | "custom";
}

const SYSTEM_PROMPT = `Anda adalah pemeriksa tata bahasa profesional untuk CV berbahasa Indonesia/Inggris. Tugas Anda hanya menemukan KESALAHAN EJAAN dan TANDA BACA berlebih.

DILARANG:
1. Memberi saran gaya / nada / penulisan ulang. Jika kalimat secara tata bahasa benar (meski kurang elegan), JANGAN laporkan.
2. Melaporkan "tidak ada kesalahan" atau pesan serupa. Jika tidak ada kesalahan, kembalikan "errors": [].
3. Mengoreksi istilah teknis kecuali Anda sangat yakin itu typo.

PERIKSA HANYA:
1. Typo (misal: "manajemn" → "manajemen").
2. Tanda baca berlebih (misal: ",,", "..").

OUTPUT (WAJIB JSON murni, tanpa markdown fence, tanpa prosa):
{
  "errors": [
    {
      "context": "kalimat lengkap berisi kesalahan (harus berasal dari teks asli)",
      "text": "potongan teks yang salah (harus persis muncul di teks asli)",
      "suggestion": "hanya kata/frasa pengganti (jangan ganti seluruh kalimat)",
      "reason": "Typo / Tanda Baca",
      "type": "spelling"
    }
  ]
}

Sekali lagi: hanya typo dan tanda baca berlebih. Tidak ada saran gaya.`;

const parseUpstreamError = (raw: string, fallback: string) => {
  if (!raw) return { message: fallback };
  try {
    const data = JSON.parse(raw) as {
      error?: { message?: string; code?: string };
      message?: string;
    };
    return {
      message: data.error?.message || data.message || fallback,
      code: data.error?.code,
    };
  } catch {
    return { message: raw };
  }
};

const buildAuthHeaders = (provider: ProviderPayload, apiKey: string): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  switch (provider.authHeader) {
    case "x-api-key":
      headers["x-api-key"] = apiKey;
      break;
    case "x-goog-api-key":
      headers["x-goog-api-key"] = apiKey;
      break;
    case "custom":
      break;
    case "bearer":
    default:
      headers["Authorization"] = `Bearer ${apiKey}`;
      break;
  }
  if (provider.customHeaders) {
    for (const [k, v] of Object.entries(provider.customHeaders)) {
      headers[k] = v;
    }
  }
  return headers;
};

/**
 * Try to coerce a free-form AI text response into a strict JSON payload
 * with a top-level `errors` array. Falls back to detecting a fenced JSON
 * block or inline object literal.
 */
const coerceJsonPayload = (text: string): { errors: any[] } | null => {
  const trimmed = (text || "").trim();
  if (!trimmed) return { errors: [] };
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && Array.isArray(parsed.errors)) return parsed;
  } catch { /* ignore */ }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      const parsed = JSON.parse(fenced[1].trim());
      if (parsed && Array.isArray(parsed.errors)) return parsed;
    } catch { /* ignore */ }
  }
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      if (parsed && Array.isArray(parsed.errors)) return parsed;
    } catch { /* ignore */ }
  }
  return { errors: [] };
};

export const Route = createFileRoute("/api/grammar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireUser(request);
        } catch (r) {
          return r as Response;
        }
        try {
          const body = await request.json();
          const { apiKey, model, content, provider } = body as {
            apiKey: string;
            model: string;
            content: string;
            provider: ProviderPayload;
          };

          if (!provider?.protocol) {
            return Response.json({ error: "Missing provider protocol" }, { status: 400 });
          }

          // Gemini path
          if (provider.protocol === "gemini") {
            const geminiModel = model || "gemini-flash-latest";
            const modelInstance = getGeminiModelInstance({
              apiKey,
              model: geminiModel,
              systemInstruction: SYSTEM_PROMPT,
              generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
              },
            });
            const result = await modelInstance.generateContent(content);
            const text = result.response.text() || "";
            return Response.json({
              choices: [{ message: { content: text } }],
            });
          }

          // Anthropic path
          if (provider.protocol === "anthropic") {
            const upstream = await callAnthropic({
              apiKey,
              model,
              system:
                SYSTEM_PROMPT +
                `\n\nPENTING: Output Anda HARUS objek JSON murni saja. Tidak boleh ada teks pengantar, tidak boleh code fence.`,
              userContent: content,
              stream: false,
              temperature: 0,
              customHeaders: provider.customHeaders,
              endpoint: provider.endpoint,
            });
            const raw = await upstream.text();
            if (!upstream.ok) {
              const fallback = `Upstream API error: ${upstream.status} ${upstream.statusText}`;
              const parsedError = parseUpstreamError(raw, fallback);
              return Response.json({ error: parsedError }, { status: upstream.status });
            }
            try {
              const data = JSON.parse(raw) as {
                content?: Array<{ type?: string; text?: string }>;
              };
              const text =
                data.content?.find((c) => c.type === "text")?.text || "";
              const coerced = coerceJsonPayload(text);
              return Response.json({
                choices: [{ message: { content: JSON.stringify(coerced) } }],
              });
            } catch {
              return Response.json(
                { error: "Invalid Anthropic response: expected JSON payload" },
                { status: 502 }
              );
            }
          }

          // OpenAI-compatible path
          const baseEndpoint = (provider.endpoint || "").trim().replace(/\/+$/, "");
          const url = baseEndpoint
            ? `${baseEndpoint}/chat/completions`
            : "https://api.openai.com/v1/chat/completions";
          const upstream = await fetch(url, {
            method: "POST",
            headers: buildAuthHeaders(provider, apiKey),
            body: JSON.stringify({
              model,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content },
              ],
            }),
          });
          const raw = await upstream.text();
          if (!upstream.ok) {
            const fallback = `Upstream API error: ${upstream.status} ${upstream.statusText}`;
            const parsedError = parseUpstreamError(raw, fallback);
            return Response.json({ error: parsedError }, { status: upstream.status });
          }
          try {
            const data = raw ? JSON.parse(raw) : {};
            // If the upstream supports response_format json_object, choices[0].message.content is already JSON-text
            // Otherwise, we coerce.
            const aiText = data?.choices?.[0]?.message?.content;
            if (aiText && typeof aiText === "string") {
              const coerced = coerceJsonPayload(aiText);
              return Response.json({
                choices: [{ message: { content: JSON.stringify(coerced) } }],
              });
            }
            return Response.json(data);
          } catch {
            return Response.json(
              { error: "Invalid upstream response: expected JSON payload" },
              { status: 502 }
            );
          }
        } catch (error) {
          console.error("Error in grammar check:", error);
          const message =
            (error as any)?.message?.toLowerCase()?.includes("anthropic")
              ? formatAnthropicErrorMessage(error)
              : formatGeminiErrorMessage(error);
          return Response.json({ error: { message } }, { status: 500 });
        }
      },
    },
  },
});
