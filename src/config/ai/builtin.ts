import type { ProviderDefinition } from "./types";

/**
 * Built-in AI providers seeded on first run.
 * User can add unlimited custom providers via the AI settings UI.
 */
export const BUILTIN_PROVIDERS: ProviderDefinition[] = [
  {
    id: "openai",
    name: "OpenAI",
    protocol: "openai-compatible",
    builtIn: true,
    endpoint: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-mini"],
    defaultModel: "gpt-4o-mini",
    authHeader: "bearer",
    apiKeyHelpUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    protocol: "anthropic",
    builtIn: true,
    endpoint: "https://api.anthropic.com/v1/messages",
    models: [
      "claude-sonnet-4-6",
      "claude-opus-4-7",
      "claude-haiku-4-5-20251001",
    ],
    defaultModel: "claude-sonnet-4-6",
    authHeader: "x-api-key",
    customHeaders: { "anthropic-version": "2023-06-01" },
    apiKeyHelpUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    protocol: "gemini",
    builtIn: true,
    endpoint: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      "gemini-flash-latest",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
    ],
    defaultModel: "gemini-flash-latest",
    authHeader: "x-goog-api-key",
    apiKeyHelpUrl: "https://aistudio.google.com/app/apikey",
  },
];

export const DEFAULT_PROVIDER_ID = "openai";

/** Returns a deep clone of built-in providers (so the store can mutate safely). */
export function cloneBuiltins(): ProviderDefinition[] {
  return BUILTIN_PROVIDERS.map((p) => ({
    ...p,
    customHeaders: p.customHeaders ? { ...p.customHeaders } : undefined,
    models: [...p.models],
  }));
}
