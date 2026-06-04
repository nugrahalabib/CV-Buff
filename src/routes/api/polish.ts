import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/server/requireUser";
import { resolveProviderEndpoint } from "@/lib/server/providerEndpoint";
import type { ProviderProtocol } from "@/config/ai/types";
import { formatGeminiErrorMessage, getGeminiModelInstance } from "@/lib/server/gemini";
import {
  callAnthropic,
  createAnthropicTextStream,
  formatAnthropicErrorMessage,
} from "@/lib/server/anthropic";

interface ProviderPayload {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  endpoint: string;
  customHeaders?: Record<string, string>;
  authHeader?: "bearer" | "x-api-key" | "x-goog-api-key" | "custom";
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

const buildSystemPrompt = (customInstructions?: string) => {
  let prompt = `Anda adalah asisten profesional untuk menyempurnakan CV. Bantu sempurnakan teks Markdown berikut agar lebih profesional dan menarik.

Prinsip:
1. Gunakan kosakata profesional yang sesuai
2. Tonjolkan pencapaian dan keterampilan
3. Singkat dan jelas
4. Gunakan kalimat aktif
5. Pertahankan keutuhan informasi asli
6. Pertahankan struktur Markdown asli (list tetap list, bold tetap bold)

Output (wajib):
1. Hanya keluarkan teks yang sudah disempurnakan
2. Dilarang menambah pengantar / penjelasan / ringkasan / saran tambahan
3. Dilarang frasa pembuka seperti "Berikut adalah..." atau "Ini adalah..."
4. Tanpa code fence (\`\`\`)
5. Sebelum mengirim, hapus konten penjelasan apa pun`;

  if (customInstructions?.trim()) {
    prompt += `\n\nInstruksi tambahan dari pengguna:\n${customInstructions.trim()}`;
  }
  return prompt;
};

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
      // user-defined headers via customHeaders only
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

const handleOpenAICompatible = async (
  provider: ProviderPayload,
  apiKey: string,
  model: string,
  systemPrompt: string,
  content: string
): Promise<Response> => {
  const baseEndpoint = provider.endpoint.trim().replace(/\/+$/, "");
  const url = baseEndpoint
    ? `${baseEndpoint}/chat/completions`
    : "https://api.openai.com/v1/chat/completions";

  const upstream = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(provider, apiKey),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const fallback = `Upstream API error: ${upstream.status} ${upstream.statusText}`;
    const rawError = await upstream.text();
    const parsedError = parseUpstreamError(rawError, fallback);
    return Response.json({ error: parsedError }, { status: upstream.status });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      if (!upstream.body) {
        controller.close();
        return;
      }
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split(/\r?\n/);
          pending = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const data = JSON.parse(payload) as {
                error?: { message?: string };
                choices?: Array<{ delta?: { content?: string } }>;
              };
              if (data.error?.message) {
                controller.error(new Error(data.error.message));
                return;
              }
              const deltaContent = data.choices?.[0]?.delta?.content;
              if (deltaContent) {
                controller.enqueue(encoder.encode(deltaContent));
              }
            } catch {
              // ignore malformed JSON chunks
            }
          }
        }
        const tail = (pending + decoder.decode()).trim();
        if (tail.startsWith("data:")) {
          const payload = tail.slice(5).trim();
          if (payload && payload !== "[DONE]") {
            try {
              const data = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const deltaContent = data.choices?.[0]?.delta?.content;
              if (deltaContent) {
                controller.enqueue(encoder.encode(deltaContent));
              }
            } catch {
              // ignore
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
};

const handleAnthropic = async (
  provider: ProviderPayload,
  apiKey: string,
  model: string,
  systemPrompt: string,
  content: string
): Promise<Response> => {
  const upstream = await callAnthropic({
    apiKey,
    model,
    system: systemPrompt,
    userContent: content,
    stream: true,
    customHeaders: provider.customHeaders,
    endpoint: provider.endpoint,
  });
  if (!upstream.ok) {
    const fallback = `Upstream API error: ${upstream.status} ${upstream.statusText}`;
    const rawError = await upstream.text();
    const parsedError = parseUpstreamError(rawError, fallback);
    return Response.json({ error: parsedError }, { status: upstream.status });
  }
  return new Response(createAnthropicTextStream(upstream), { headers: SSE_HEADERS });
};

const handleGemini = async (
  apiKey: string,
  model: string,
  systemPrompt: string,
  content: string
): Promise<Response> => {
  const modelInstance = getGeminiModelInstance({
    apiKey,
    model: model || "gemini-flash-latest",
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.4 },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const result = await modelInstance.generateContentStream(content);
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            controller.enqueue(encoder.encode(chunkText));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
  return new Response(stream, { headers: SSE_HEADERS });
};

export const Route = createFileRoute("/api/polish")({
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
          const { apiKey, model, content, provider, customInstructions } = body as {
            apiKey: string;
            model: string;
            content: string;
            provider: ProviderPayload;
            customInstructions?: string;
          };

          if (!provider?.protocol) {
            return Response.json({ error: { message: "Missing provider protocol" } }, { status: 400 });
          }

          // Anti-SSRF: built-ins use server-known endpoints; custom endpoints are guarded.
          let safeEndpoint: string;
          try {
            safeEndpoint = await resolveProviderEndpoint(provider.id, provider.endpoint);
          } catch (r) {
            return r as Response;
          }
          const safeProvider = { ...provider, endpoint: safeEndpoint };

          const systemPrompt = buildSystemPrompt(customInstructions);

          switch (provider.protocol) {
            case "anthropic":
              return await handleAnthropic(safeProvider, apiKey, model, systemPrompt, content);
            case "gemini":
              return await handleGemini(apiKey, model, systemPrompt, content);
            case "openai-compatible":
            default:
              return await handleOpenAICompatible(safeProvider, apiKey, model, systemPrompt, content);
          }
        } catch (error) {
          console.error("Polish error:", error);
          const message =
            (error as any)?.message?.includes("anthropic") ||
            (error as any)?.message?.includes("Anthropic")
              ? formatAnthropicErrorMessage(error)
              : formatGeminiErrorMessage(error);
          return Response.json({ error: { message } }, { status: 500 });
        }
      },
    },
  },
});
