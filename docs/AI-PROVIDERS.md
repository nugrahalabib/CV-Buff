# AI-PROVIDERS.md — Sistem Registry AI Provider

> Dokumen ini menjelaskan arsitektur, cara kerja, dan cara extending sistem AI provider di CV-Buff. Wajib dibaca sebelum menyentuh fitur AI.

---

## 🎯 Filosofi Desain

CV-Buff TIDAK lock-in ke provider AI tertentu. User bisa pakai:

- **Built-in providers** (siap dipakai dengan API key sendiri):
  - **OpenAI** — model GPT-4o, GPT-4o-mini, o1
  - **Anthropic Claude** — model Claude Sonnet 4.6, Opus 4.7, Haiku 4.5
  - **Google Gemini** — model Gemini Flash, Pro
- **Custom providers** (user bisa add provider apa pun):
  - Groq, OpenRouter, Together AI, Perplexity, Mistral
  - LLM lokal: Ollama, LM Studio, LocalAI
  - Self-hosted: vLLM, Text Generation Inference, dll.

Asal endpoint kompatibel dengan salah satu dari 3 protocol berikut:

1. **`openai-compatible`** — format `/chat/completions` ala OpenAI (paling umum)
2. **`anthropic`** — format `/v1/messages` ala Anthropic
3. **`gemini`** — format Google Generative AI SDK

---

## 🏗️ Komponen Utama

### 1. `src/config/ai/types.ts` — Interface Definition

```ts
export type ProviderProtocol = "openai-compatible" | "anthropic" | "gemini";

export type AuthHeaderType = "bearer" | "x-api-key" | "x-goog-api-key" | "custom";

export interface ProviderDefinition {
  id: string;              // slug unik: "openai", "claude", "gemini", "custom-xxxx"
  name: string;            // display label
  protocol: ProviderProtocol;
  builtIn: boolean;        // true untuk seed providers
  endpoint: string;        // base URL (OpenAI: ".../v1") atau full URL (Anthropic: ".../messages")
  models: string[];        // suggested models (combobox di UI)
  defaultModel?: string;
  authHeader: AuthHeaderType;
  customHeaders?: Record<string, string>;
  apiKey?: string;         // dari user
  selectedModel?: string;  // override defaultModel
  apiKeyHelpUrl?: string;  // link "Get API Key" di UI
}

export function isProviderConfigured(p: ProviderDefinition | undefined | null): boolean
export function getEffectiveModel(p: ProviderDefinition): string
export function buildAuthHeaders(p: ProviderDefinition, apiKey: string): Record<string, string>
```

### 2. `src/config/ai/builtin.ts` — Seed Providers

```ts
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
    models: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5-20251001"],
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
    models: ["gemini-flash-latest", "gemini-2.5-pro", "gemini-2.5-flash"],
    defaultModel: "gemini-flash-latest",
    authHeader: "x-goog-api-key",
    apiKeyHelpUrl: "https://aistudio.google.com/app/apikey",
  },
];

export const DEFAULT_PROVIDER_ID = "openai";
```

### 3. `src/store/useAIConfigStore.ts` — Zustand Registry Store

```ts
interface AIConfigState {
  providers: ProviderDefinition[];      // built-ins + user-added
  activeProviderId: string;

  setActive(id: string): void
  getActive(): ProviderDefinition | undefined
  getProvider(id: string): ProviderDefinition | undefined
  updateProvider(id, patch: Partial<ProviderDefinition>): void
  addCustomProvider(init): string       // returns new "custom-xxxx" id
  removeProvider(id): void               // refuse if builtIn
  resetProvider(id): void                // reset built-in ke default
  isConfigured(): boolean
}
```

**Persist key**: `cv-buff-ai-config`
**Persist version**: `2` (untuk migration dari schema lama)

Pada first-load, jika `providers` empty/legacy → seed dengan `BUILTIN_PROVIDERS`.

### 4. `src/routes/api/polish.ts` — Streaming Polish Endpoint

```ts
POST /api/polish
Body: {
  provider: { id, name, protocol, endpoint, customHeaders, authHeader },
  apiKey: string,
  model: string,
  content: string,           // Markdown source
  customInstructions?: string
}

Response (streaming): text/event-stream
```

Switch by `provider.protocol`:
- `anthropic` → `callAnthropic()` + `createAnthropicTextStream()` (lihat `src/lib/server/anthropic.ts`)
- `gemini` → `getGeminiModelInstance().generateContentStream()`
- `openai-compatible` → fetch `{endpoint}/chat/completions` dengan `stream: true`

Server **tidak menyimpan apa pun** — hanya proxy stream.

### 5. `src/routes/api/grammar.ts` — Grammar Check Endpoint

```ts
POST /api/grammar
Body: { provider, apiKey, model, content }
Response: { choices: [{ message: { content: "<JSON-string>" } }] }
```

JSON content adalah `{ errors: GrammarError[] }`. Server pakai `coerceJsonPayload()` helper untuk handle response dari provider yang tidak strict JSON (misal Anthropic atau OpenAI-compatible yang tidak support `response_format: {type: "json_object"}`).

### 6. `src/lib/server/anthropic.ts` — Anthropic Adapter

```ts
callAnthropic(opts: {
  apiKey, model, system, userContent,
  stream?, maxTokens?, temperature?,
  customHeaders?, endpoint?
}): Promise<Response>

createAnthropicTextStream(upstream: Response): ReadableStream<Uint8Array>
formatAnthropicErrorMessage(error): string
```

**Kenapa adapter terpisah?**

Anthropic Messages API format **berbeda** dari OpenAI:

| Aspek | OpenAI | Anthropic |
|---|---|---|
| System prompt | `messages: [{role:"system",...}, ...]` | Top-level field `system: "..."` |
| Max tokens | optional | **wajib** (`max_tokens`) |
| Streaming SSE event | `data: {choices:[{delta:{content:"..."}}]}\n\n` | `event: content_block_delta\ndata: {type:"content_block_delta", delta:{type:"text_delta", text:"..."}}\n\n` |
| Terminator | `data: [DONE]\n\n` | `event: message_stop\n\n` |
| Non-stream response | `{choices:[{message:{content:"..."}}]}` | `{content:[{type:"text", text:"..."}]}` |

`createAnthropicTextStream()` parse SSE events Anthropic, extract `delta.text`, emit sebagai raw bytes — **format yang sama** dengan OpenAI handler. Client (`AIPolishDialog`) tidak perlu tahu protocol — cukup baca text stream.

### 7. `src/lib/server/gemini.ts` — Gemini Adapter

Pakai SDK `@google/generative-ai` (sudah ada di dependencies).

```ts
getGeminiModelInstance({ apiKey, model, systemInstruction, generationConfig })
ensureGeminiProxyDispatcher()    // untuk HTTPS_PROXY env (di lingkungan corp)
formatGeminiErrorMessage(error)
```

### 8. `src/app/app/dashboard/ai/page.tsx` — UI

Layout:
- **Left rail**: list semua provider (built-in + custom), badge configured/unconfigured, tombol "+ Tambah Provider Custom"
- **Right pane**: form detail provider yang dipilih
  - Untuk built-in: form simpel (API Key, Model selector + custom override)
  - Untuk custom: form lengkap (Name, Protocol dropdown, Endpoint, API Key, Model, Custom Headers JSON)
  - Toggle "Advanced Settings" untuk show/hide Endpoint + Custom Headers fields

---

## 🛠️ How-To: Tambah Built-in Provider Baru

### Case A: Provider Baru Pakai Protocol yang Sudah Ada

Contoh: Tambah **Mistral AI** (OpenAI-compatible).

**Cukup edit 1 file**: `src/config/ai/builtin.ts`

```ts
{
  id: "mistral",
  name: "Mistral AI",
  protocol: "openai-compatible",
  builtIn: true,
  endpoint: "https://api.mistral.ai/v1",
  models: ["mistral-large-latest", "mistral-small-latest", "open-mixtral-8x7b"],
  defaultModel: "mistral-small-latest",
  authHeader: "bearer",
  apiKeyHelpUrl: "https://console.mistral.ai/api-keys/",
},
```

Lalu (opsional) bikin icon di `src/components/ai/icon/IconMistral.tsx` dan daftarkan di `PROVIDER_ICONS` di `src/app/app/dashboard/ai/page.tsx`.

**SELESAI.** Provider muncul di UI, store seed otomatis include provider baru via `ensureBuiltins()`.

### Case B: Provider Baru Pakai Protocol BARU

Contoh: Tambah **Cohere** yang punya protocol `/v1/chat`.

**Step 1**: Edit `src/config/ai/types.ts` — tambah literal ke `ProviderProtocol`:

```ts
export type ProviderProtocol = "openai-compatible" | "anthropic" | "gemini" | "cohere";
```

**Step 2**: Buat adapter `src/lib/server/cohere.ts`:

```ts
export async function callCohere(opts: { ... }): Promise<Response> { ... }
export function createCohereTextStream(upstream: Response): ReadableStream { ... }
```

**Step 3**: Edit `src/routes/api/polish.ts` — tambah case untuk `"cohere"`:

```ts
switch (provider.protocol) {
  case "anthropic": return await handleAnthropic(...);
  case "gemini": return await handleGemini(...);
  case "cohere": return await handleCohere(...);    // NEW
  case "openai-compatible":
  default: return await handleOpenAICompatible(...);
}
```

**Step 4**: Sama untuk `grammar.ts`.

**Step 5**: Update UI dropdown protocol di `src/app/app/dashboard/ai/page.tsx`:

```tsx
<SelectItem value="cohere">Cohere</SelectItem>
```

**Step 6**: Tambah label di `id.json` & `en.json`:

```json
"dashboard.settings.ai.protocols.cohere": "Cohere"
```

**Step 7**: Tambah entry di `BUILTIN_PROVIDERS` dengan `protocol: "cohere"`.

---

## 🧪 How-To: User Add Custom Provider via UI

User flow di production:

1. Buka **`/app/dashboard/ai`**
2. Klik tombol **"+ Tambah Provider Custom"**
3. Isi form:
   - **Nama Provider**: e.g. "Groq Llama 3.3"
   - **Protokol**: pilih dari dropdown (OpenAI Compatible / Anthropic / Gemini)
   - **Endpoint**: e.g. `https://api.groq.com/openai/v1`
   - **API Key**: paste dari dashboard provider
   - **Model ID**: e.g. `llama-3.3-70b-versatile`
   - **(Opsional) Custom Headers**: JSON string, e.g. `{"x-organization":"...","x-user":"..."}`
4. Klik tombol check (✓) di item provider untuk set sebagai **active**
5. Provider siap dipakai untuk Polish & Grammar Check

Programmatic:

```ts
const store = useAIConfigStore.getState();
const id = store.addCustomProvider({
  name: "Groq Llama 3.3",
  protocol: "openai-compatible",
  endpoint: "https://api.groq.com/openai/v1",
  apiKey: "gsk_...",
  selectedModel: "llama-3.3-70b-versatile",
  authHeader: "bearer",
});
store.setActive(id);
```

---

## 🔍 Debugging Tips

### Provider tidak muncul di UI

- Cek `BUILTIN_PROVIDERS` di `src/config/ai/builtin.ts`
- Cek browser DevTools → Application → LocalStorage → `cv-buff-ai-config`
- Reset state: hapus key tersebut + reload

### Polish stream tidak masuk

- Buka DevTools Network → cari request ke `/api/polish`
- Cek response header: `Content-Type: text/event-stream`?
- Cek payload request: `provider.protocol` benar?
- Test direct ke provider:
  ```bash
  curl -X POST https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer sk-..." \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4o-mini","stream":true,"messages":[{"role":"user","content":"hi"}]}'
  ```

### Grammar JSON parse error

- Provider mungkin tidak support `response_format: {type: "json_object"}` → `coerceJsonPayload()` fallback ke regex extraction
- Cek `console.log(aiResponse)` di `useGrammarStore.checkGrammar()`
- Anthropic: pastikan system prompt explicit "Output JSON murni, tanpa code fence"

### CORS error

API routes pakai same-origin (request dari frontend ke `/api/*`). Tidak ada CORS issue normal-nya. Jika test direct dari curl atau Postman, pastikan dari domain yang sama.

### Custom Headers tidak terkirim

UI parse JSON via `JSON.parse(rawString)`. Jika input JSON tidak valid (e.g. trailing comma), parse fail silently dan state tidak update. Cek dengan `console.log(viewing.customHeaders)`.

---

## 🚨 Pitfalls yang Sering Terjadi

1. **Anthropic tanpa `max_tokens`** → 400 Bad Request. Adapter set default 4096.
2. **OpenAI-compatible tanpa `endpoint`** → fallback ke OpenAI URL. Untuk Groq/OpenRouter, **wajib** isi endpoint.
3. **Gemini API key salah format** → 401 dengan message "API_KEY_INVALID". Pastikan dari https://aistudio.google.com/app/apikey (bukan Cloud Console).
4. **Custom Provider tidak masuk ke `getActive()`** → cek `setActive(id)` dipanggil setelah `addCustomProvider`. UI sudah handle ini.
5. **`response_format: {type: "json_object"}` di OpenAI custom endpoint** — beberapa provider OpenAI-compatible (Ollama, vLLM) tidak support. Grammar endpoint akan fallback ke parsing manual.

---

## 📋 Provider Endpoint Cheat Sheet

| Provider | Protocol | Endpoint | Auth Header |
|---|---|---|---|
| OpenAI | openai-compatible | `https://api.openai.com/v1` | `Authorization: Bearer` |
| Anthropic | anthropic | `https://api.anthropic.com/v1/messages` | `x-api-key` + `anthropic-version: 2023-06-01` |
| Google Gemini | gemini | `https://generativelanguage.googleapis.com/v1beta` | `x-goog-api-key` |
| Groq | openai-compatible | `https://api.groq.com/openai/v1` | `Authorization: Bearer` |
| OpenRouter | openai-compatible | `https://openrouter.ai/api/v1` | `Authorization: Bearer` |
| Together AI | openai-compatible | `https://api.together.xyz/v1` | `Authorization: Bearer` |
| Perplexity | openai-compatible | `https://api.perplexity.ai` | `Authorization: Bearer` |
| Mistral | openai-compatible | `https://api.mistral.ai/v1` | `Authorization: Bearer` |
| Ollama (local) | openai-compatible | `http://localhost:11434/v1` | `Authorization: Bearer ollama` (dummy) |
| LM Studio (local) | openai-compatible | `http://localhost:1234/v1` | `Authorization: Bearer lm-studio` |
| vLLM | openai-compatible | `http://<host>/v1` | (configurable) |

---

## 🔒 Keamanan API Key

- API key disimpan di **LocalStorage** (Zustand persist) — di browser user, tidak di server
- Saat request ke `/api/polish` & `/api/grammar`, API key dikirim dari client ke server kita (HTTPS) → server forward ke provider
- Server **TIDAK log API key** di console / file / database
- Server **TIDAK cache response** — pure pass-through

**Catatan**: Jika user paranoid level extreme, mereka bisa run CV-Buff secara lokal (`pnpm dev` di mesin sendiri) dan API key tidak akan pernah lewat infra orang lain.

---

## 🎯 Roadmap untuk AI Provider System

- ⬜ **Provider preset gallery** — UI dropdown di "Tambah Provider Custom" dengan preset cepat untuk Groq, OpenRouter, Together, dll. (saat ini user harus input manual)
- ⬜ **Model auto-discovery** — fetch `/v1/models` untuk provider OpenAI-compatible, populate combobox otomatis
- ⬜ **Cost estimation** — track token usage, estimasi biaya per provider
- ⬜ **Provider testing tombol** — UI button "Test Connection" untuk verify endpoint + apiKey sebelum save
- ⬜ **Per-feature provider override** — Polish pakai Claude, Grammar pakai Gemini Flash, PDF Import pakai Gemini Pro (sekarang semua pakai 1 active provider)
- ⬜ **Rate limit handling** — retry with exponential backoff
- ⬜ **Multi-provider fallback chain** — jika provider primary down, fallback ke secondary
