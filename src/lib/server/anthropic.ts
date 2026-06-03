/**
 * Anthropic Messages API adapter.
 * Endpoint: https://api.anthropic.com/v1/messages
 * Auth: x-api-key + anthropic-version: 2023-06-01
 *
 * The streaming format is SSE-typed events that differ from OpenAI's:
 *   event: content_block_delta
 *   data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"..."}}
 *   ...
 *   event: message_stop
 *
 * createAnthropicTextStream() normalizes the upstream into a raw text stream
 * matching what the OpenAI handler emits, so the client-side polish/grammar
 * code can stay protocol-agnostic.
 */

export interface AnthropicCallOptions {
  apiKey: string;
  model: string;
  system: string;
  userContent: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  customHeaders?: Record<string, string>;
  endpoint?: string;
}

const DEFAULT_ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_ANTHROPIC_VERSION = "2023-06-01";

export async function callAnthropic(opts: AnthropicCallOptions): Promise<Response> {
  const url = (opts.endpoint && opts.endpoint.trim()) || DEFAULT_ANTHROPIC_ENDPOINT;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": opts.apiKey,
    "anthropic-version": DEFAULT_ANTHROPIC_VERSION,
  };
  if (opts.customHeaders) {
    for (const [k, v] of Object.entries(opts.customHeaders)) {
      headers[k] = v;
    }
  }
  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: opts.model,
      system: opts.system,
      messages: [{ role: "user", content: opts.userContent }],
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.4,
      stream: !!opts.stream,
    }),
  });
}

/**
 * Parse the Anthropic SSE stream and emit only the textual deltas
 * as a plain UTF-8 byte stream that mirrors what the OpenAI handler
 * sends to the browser.
 */
export function createAnthropicTextStream(upstream: Response): ReadableStream<Uint8Array> {
  const reader = upstream.body?.getReader();
  return new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close();
        return;
      }
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Anthropic SSE events are separated by blank lines (\n\n)
          let sepIndex: number;
          while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);
            const line = rawEvent
              .split("\n")
              .map((s) => s.trim())
              .find((s) => s.startsWith("data:"));
            if (!line) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload) as {
                type?: string;
                delta?: { type?: string; text?: string };
                error?: { message?: string };
              };
              if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
                if (json.delta.text) {
                  controller.enqueue(encoder.encode(json.delta.text));
                }
              } else if (json.type === "error") {
                controller.error(new Error(json.error?.message || "Anthropic error"));
                return;
              } else if (json.type === "message_stop") {
                controller.close();
                return;
              }
              // Ignore other event types (ping, message_start, content_block_start, etc.)
            } catch {
              // Ignore malformed event lines
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export function formatAnthropicErrorMessage(error: unknown): string {
  const anyError = error as any;
  if (typeof anyError?.message === "string" && anyError.message) {
    return anyError.message;
  }
  return "Anthropic request failed";
}
