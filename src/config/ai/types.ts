/**
 * Generic AI provider registry types.
 * Built-in providers (OpenAI, Claude, Gemini) plus user-defined custom slots.
 */

export type ProviderProtocol = "openai-compatible" | "anthropic" | "gemini";

export type AuthHeaderType = "bearer" | "x-api-key" | "x-goog-api-key" | "custom";

export interface ProviderDefinition {
  /** unique slug, e.g. "openai", "claude", "gemini", or "custom-1" */
  id: string;
  /** display label */
  name: string;
  /** dictates request/response/streaming format */
  protocol: ProviderProtocol;
  /** true for OpenAI/Claude/Gemini; false for user-added custom */
  builtIn: boolean;
  /** base URL ("/v1" for OpenAI-compat, full URL for Anthropic) */
  endpoint: string;
  /** suggested models (free-text input still allowed) */
  models: string[];
  defaultModel?: string;
  authHeader: AuthHeaderType;
  /** e.g. {"anthropic-version":"2023-06-01"} */
  customHeaders?: Record<string, string>;
  /** user-supplied; persisted in store */
  apiKey?: string;
  /** user-selected model (overrides defaultModel) */
  selectedModel?: string;
  /** "Get API Key" link in UI */
  apiKeyHelpUrl?: string;
}

export function isProviderConfigured(p: ProviderDefinition | undefined | null): boolean {
  if (!p) return false;
  if (!p.apiKey || !p.apiKey.trim()) return false;
  if (!p.endpoint || !p.endpoint.trim()) return false;
  const model = (p.selectedModel || p.defaultModel || "").trim();
  if (!model) return false;
  return true;
}

export function getEffectiveModel(p: ProviderDefinition): string {
  return (p.selectedModel || p.defaultModel || "").trim();
}

export function buildAuthHeaders(p: ProviderDefinition, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  switch (p.authHeader) {
    case "bearer":
      headers["Authorization"] = `Bearer ${apiKey}`;
      break;
    case "x-api-key":
      headers["x-api-key"] = apiKey;
      break;
    case "x-goog-api-key":
      headers["x-goog-api-key"] = apiKey;
      break;
    case "custom":
      // Custom auth: user must define via customHeaders (e.g. Authorization: ...)
      break;
  }
  if (p.customHeaders) {
    for (const [k, v] of Object.entries(p.customHeaders)) {
      headers[k] = v;
    }
  }
  return headers;
}
