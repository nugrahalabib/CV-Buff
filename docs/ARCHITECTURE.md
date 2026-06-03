# ARCHITECTURE.md — Arsitektur Teknis CV-Buff

> Dokumen ini menjelaskan keputusan arsitektur, alur data, dan komponen utama CV-Buff. Wajib dibaca sebelum melakukan perubahan struktural.

---

## 🏛️ Filosofi Arsitektur

> **⚠️ UPDATE (2026-06-04):** Arsitektur berubah — kini ada **login Google wajib** dan **CV tersimpan di server (PostgreSQL self-hosted, per-akun terisolasi)**, bukan lagi di perangkat. Fitur folder-sync (File System Access/IndexedDB) + persist LocalStorage untuk CV **sudah dihapus**. Bagian di bawah yang masih menyebut "storage di browser / folder sync" adalah deskripsi lama — acuan terkini: **[AUTH.md](./AUTH.md)**. Yang tetap client-side HANYA kunci API AI user.

CV-Buff dibangun dengan prinsip:

1. **Akun & Isolasi** — Akses app wajib login Google. **Isi CV tersimpan di server (PostgreSQL, tabel `resume` per-`user.id`)**, terisolasi penuh; tak ada user yang bisa melihat/mengubah data user lain. CV sampai ke perangkat hanya saat download/export.
2. **Vendor-Agnostic AI** — User bebas memilih provider AI apa pun (OpenAI, Claude, Gemini, atau custom). **API key milik user TIDAK PERNAH ke server** (tetap di browser, LocalStorage `cv-buff-ai-config`); traffic AI lewat proxy server tanpa menyimpan key.
3. **Node/Docker Deployment** — Auth + Postgres butuh backend stateful → deploy di **Node/Docker/VPS** (bukan edge murni). Landing publik tetap SSR untuk SEO.
4. **Sinkron Lintas Perangkat** — Karena CV di server per-akun, login akun yang sama di perangkat lain langsung menampilkan semua CV (tanpa sync manual).

---

## 🧱 Tech Stack Layering

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER (CLIENT)                       │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  TanStack Router        │  │  Zustand Stores         │   │
│  │  (file-based routes)    │  │  + persist (LocalStorage)│   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  React 18 Components    │  │  Tiptap Rich Editor     │   │
│  │  + shadcn/ui + HeroUI   │  │  (color/list/link)      │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  Tailwind CSS 3.4       │  │  Framer Motion 11       │   │
│  │  + tailwindcss-animate  │  │  (page transitions)     │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  IndexedDB              │  │  File System Access API │   │
│  │  (FileHandleDB)         │  │  (folder sync)          │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              ↕ HTTP/SSE
┌──────────────────────────────────────────────────────────────┐
│                  TANSTACK START SERVER (EDGE)                 │
│                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │  Route Handlers         │  │  AI Proxy Routes        │   │
│  │  (SSR HTML + assets)    │  │  /api/polish (SSE)       │   │
│  │                         │  │  /api/grammar (JSON)     │   │
│  │                         │  │  /api/resume-import      │   │
│  │                         │  │  /api/proxy/image        │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌──────────────────────────────────────────────────────────────┐
│                       AI PROVIDERS                            │
│                                                              │
│  OpenAI │ Anthropic │ Gemini │ Groq │ OpenRouter │ Ollama   │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛣️ Routing (TanStack Router)

CV-Buff pakai **file-based routing** dari TanStack Router. File di `src/routes/` otomatis jadi route.

### Public Routes (SSR)

| URL Pattern | File | Deskripsi |
|---|---|---|
| `/` | `routes/index.tsx` | Redirect ke `/id` (default locale) |
| `/$locale` | `routes/$locale.tsx` | Landing page (SEO meta per locale) |

### App Routes (CSR Only)

Routes di bawah `/app` punya `ssr: false` karena butuh akses LocalStorage & IndexedDB (browser-only API).

| URL Pattern | File | Deskripsi |
|---|---|---|
| `/app` | `routes/app/index.tsx` | Redirect ke `/app/dashboard` |
| `/app/dashboard` | `routes/app/dashboard.tsx` | Dashboard wrapper (Outlet) |
| `/app/dashboard/` | `routes/app/dashboard/index.tsx` | Redirect ke `/resumes` |
| `/app/dashboard/resumes` | `routes/app/dashboard/resumes.tsx` | List CV |
| `/app/dashboard/templates` | `routes/app/dashboard/templates.tsx` | Template gallery |
| `/app/dashboard/ai` | `routes/app/dashboard/ai.tsx` | AI Provider config |
| `/app/workbench/$id` | `routes/app/workbench/$id.tsx` | Editor 3-panel |
| `/app/preview-template/$id` | `routes/app/preview-template/$id.tsx` | Standalone preview template (untuk thumbnails) |

### API Routes (Server Handlers)

TanStack Start API endpoints. Pakai pattern `server.handlers.{METHOD}` dalam file route.

| Endpoint | File | Method | Deskripsi |
|---|---|---|---|
| `/api/polish` | `routes/api/polish.ts` | POST | Streaming AI polish (SSE) |
| `/api/grammar` | `routes/api/grammar.ts` | POST | Grammar check (JSON response) |
| `/api/resume-import` | `routes/api/resume-import.ts` | POST | Parse PDF → struktur JSON (via Gemini Vision) |
| `/api/proxy/image` | `routes/api/proxy/image.ts` | GET | Image proxy (untuk avatar URL eksternal yang CORS-blocked) |

### Root Layout

`routes/__root.tsx` adalah root layout. Setup:
- `<html lang>` dari locale
- Inject `globals.css` + `font.css`
- `NextIntlClientProvider` dengan `timeZone="Asia/Jakarta"`
- `<Providers>` (HeroUI + ThemeProvider + ResumeDirectorySync)
- `<Toaster>` dari sonner

---

## 💾 State Management (Zustand)

### Stores

#### `useResumeStore` — Multi-Resume Manager

**File**: `src/store/useResumeStore.ts`
**Storage**: server-side (PostgreSQL tabel `resume`, per-`user.id`) — dimuat via `loadResumes()`, auto-save debounced PUT. **Tidak** persist ke LocalStorage.
**State**:
```ts
interface ResumeStore {
  resumes: Record<string, ResumeData>;          // multiple CVs by id
  activeResumeId: string | null;
  activeResume: ResumeData | null;

  // CRUD
  createResume(templateId, isBlank?): string
  deleteResume(resume)
  duplicateResume(resumeId): string
  updateResume(id, data)

  // Section updates (basic, education, experience, dst.)
  updateBasicInfo(data)
  updateEducation(edu)
  updateEducationBatch(eds[])
  // ... dst untuk setiap section

  // Global settings
  updateGlobalSettings(settings)
  setThemeColor(color)
  setTemplate(templateId)
}
```

**Behavior penting**:
- **Auto-save debounced**: ~1.2 detik. Edit di editor → debounced `PUT /api/resumes/:id` ke server (terisolasi per-user).
- **Locale fallback**: default `"id"`
- **Title fallback**: `"CV Baru"` / `"New Resume"`, `"Salinan"` / `"Copy"` (sesuai locale)

#### `useAIConfigStore` — Provider Registry

**File**: `src/store/useAIConfigStore.ts`
**Persist key**: `cv-buff-ai-config`
**State**:
```ts
interface AIConfigState {
  providers: ProviderDefinition[];   // built-ins + custom
  activeProviderId: string;

  setActive(id)
  getActive(): ProviderDefinition | undefined
  getProvider(id)
  updateProvider(id, patch)
  addCustomProvider(init): string    // returns new id "custom-xxxx"
  removeProvider(id)                  // refuse if builtIn
  resetProvider(id)                   // reset built-in to default
  isConfigured(): boolean
}
```

**Migrate strategy**: Bila state lama (pre-registry) dideteksi, seed ulang dengan `BUILTIN_PROVIDERS`. Field `version: 2` di persist config.

#### `useGrammarStore` — Grammar Errors Highlight

**File**: `src/store/useGrammarStore.ts`
**Tidak persist** (state ephemeral per session)
**State**:
```ts
interface GrammarStore {
  errors: GrammarError[];
  isChecking: boolean;
  selectedErrorIndex: number | null;
  highlightKey: number;

  checkGrammar(text)                 // fetch /api/grammar
  clearErrors()
  selectError(index)
  dismissError(index)
}
```

**Behavior**: Pakai `mark.js` untuk highlight error fragments di `#resume-preview` element.

---

## 📦 Tipe Data Utama

### `ResumeData`

File: `src/types/resume.ts`

```ts
interface ResumeData {
  id: string;
  title: string;
  createdAt: string;       // ISO timestamp
  updatedAt: string;
  templateId: string | null | undefined;

  basic: BasicInfo;        // name, title, email, phone, location, etc.
  education: Education[];
  experience: Experience[];
  projects: Project[];
  certificates: Certificate[];
  customData: Record<string, CustomItem[]>;  // unlimited custom sections
  skillContent: string;    // rich HTML
  selfEvaluationContent: string;  // rich HTML

  activeSection: string;
  draggingProjectId: string | null;
  menuSections: MenuSection[];   // ordering & visibility
  globalSettings: GlobalSettings; // themeColor, font, spacing, dll.
}
```

### `ProviderDefinition`

File: `src/config/ai/types.ts`

```ts
interface ProviderDefinition {
  id: string;                    // "openai" | "claude" | "gemini" | "custom-xxxx"
  name: string;
  protocol: "openai-compatible" | "anthropic" | "gemini";
  builtIn: boolean;
  endpoint: string;
  models: string[];              // suggested
  defaultModel?: string;
  authHeader: "bearer" | "x-api-key" | "x-goog-api-key" | "custom";
  customHeaders?: Record<string, string>;
  apiKey?: string;
  selectedModel?: string;
  apiKeyHelpUrl?: string;
}
```

### `ResumeTemplate`

File: `src/types/template.ts`

```ts
interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  layout: string;                // identifier untuk component
  colorScheme: { primary, secondary, background, text };
  spacing: { sectionGap, itemGap, contentPadding };
  basic: { layout: "left" | "center" | "right" };
  availableSections: string[];
}
```

---

## 🎨 Komponen Hierarki

### Workbench Editor (3-Panel)

```
WorkbenchPage (app/app/workbench/[id]/page.tsx)
├── EditorHeader               ← title, back, ThemeToggle
├── ResizablePanelGroup
│   ├── SidePanel              ← layout sections, theme color, typography, spacing, mode
│   ├── EditPanel              ← form aktif (basic, edu, exp, dll.)
│   │   ├── BasicPanel
│   │   ├── EducationPanel
│   │   ├── ExperiencePanel
│   │   ├── ProjectPanel
│   │   ├── SkillPanel (Tiptap)
│   │   ├── SelfEvaluationPanel (Tiptap)
│   │   ├── CustomPanel
│   │   └── CertificatesPanel
│   └── PreviewPanel            ← iframe-based real-time render
│       └── IframeTemplateViewer
│           └── <TemplateComponent>   ← Classic | Modern | Timeline | dll.
└── PreviewDock                 ← export PDF/JSON/Markdown, grammar check, auto-one-page
```

### Template System

Setiap template adalah folder di `src/components/templates/<name>/`:

```
templates/<name>/
├── config.ts         ← ResumeTemplate object
├── index.tsx         ← Main component (renders sections in order)
└── sections/
    ├── BaseInfo.tsx
    ├── ExperienceSection.tsx
    ├── EducationSection.tsx
    ├── ProjectSection.tsx
    ├── SkillSection.tsx
    ├── SelfEvaluationSection.tsx
    ├── CustomSection.tsx
    └── SectionTitle.tsx
```

Semua template diregistrasi di `src/components/templates/registry.ts`. Komponen utama dipilih via `getTemplateComponent(layoutId)`.

---

## 🔄 Alur Data Utama

### Edit CV → Persist → Sync

```
User edit form
    ↓
useResumeStore.updateBasicInfo({...})
    ↓
setState() + updatedAt ISO timestamp
    ↓
zustand persist → LocalStorage (cv-buff-resume-storage)
    ↓
debouncedSyncToFile(resume) [1.5s debounce]
    ↓
File System Access API → write to user-selected folder
    ↓
File <title>.json updated
```

### AI Polish (Streaming)

```
User klik "AI Polish" di Tiptap toolbar
    ↓
AIPolishDialog opens (dengan content sebagai HTML)
    ↓
turndownService.turndown(content) → Markdown
    ↓
fetch POST /api/polish {provider, apiKey, model, content, customInstructions}
    ↓
Server: switch (provider.protocol)
    ├── anthropic → callAnthropic + createAnthropicTextStream
    ├── gemini → getGeminiModelInstance.generateContentStream
    └── openai-compatible → fetch OpenAI-format SSE
    ↓
Server returns SSE text stream (Content-Type: text/event-stream)
    ↓
Client reads ReadableStream, append to polishedContent state
    ↓
Streamdown renders Markdown progressively in dialog
    ↓
User klik "Apply" → md.render(polishedContent) → HTML
    ↓
onApply(html) → Tiptap setContent
```

### AI Grammar Check (JSON)

```
User klik "AI Grammar Check" di PreviewDock
    ↓
useGrammarStore.checkGrammar(previewElement.innerText)
    ↓
fetch POST /api/grammar {provider, apiKey, model, content}
    ↓
Server: protocol switch (same as polish, but non-streaming)
    ↓
Response: {choices:[{message:{content: "<JSON-text>"}}]}
    ↓
Client parse JSON.parse(content) → {errors: GrammarError[]}
    ↓
new Mark(previewEl).unmark()
errors.forEach(err => marker.mark(err.text, {className: "grammar-error"}))
    ↓
User klik error → GrammarCheckDrawer shows suggestion → Apply/Ignore
```

### Template Switching

```
User klik template di SidePanel
    ↓
useResumeStore.setTemplate(templateId)
    ↓
Find template config in DEFAULT_TEMPLATES
    ↓
Update resume.templateId + apply template's colorScheme + spacing + basic.layout
    ↓
Persist + sync to file
    ↓
PreviewPanel re-renders via TemplateComponent
```

---

## 📤 Export System

### PDF Server Export

**Flow**:
1. Client `pnpm` tidak hosts PDF service — endpoint hardcoded di `PDF_EXPORT_CONFIG.SERVER_URL` (`https://api.cv.agentbuff.id/generate-pdf`)
2. Server (Puppeteer + @sparticuz/chromium) menerima HTML + CSS embedded + base64 fonts
3. Renders to PDF dengan A4 size
4. Returns binary PDF stream
5. Client triggers download

### Browser Print (Fallback)

**Flow** (di `src/utils/print.ts`):
1. Buat hidden iframe
2. Tulis HTML + CSS dengan `@page { size: A4 }`
3. Wait fonts.ready + images.complete
4. `iframe.contentWindow.print()`
5. Hapus iframe setelah `afterprint` event

### JSON Export

**Flow** (di `src/utils/export.ts`):
1. Serialize `activeResume` ke JSON
2. Trigger download blob

### Markdown Export

**Flow**:
1. Iterate enabled `menuSections` in order
2. For each section, format heading + content
3. Convert Tiptap HTML → Markdown via `turndown`
4. Assemble & download

---

## 🌐 i18n System

CV-Buff pakai **custom compat layer** yang meniru API `next-intl`. File:

- `src/i18n/config.ts` — Definisi locale + default
- `src/i18n/locales/id.json`, `en.json` — Translation files (struktur identik)
- `src/i18n/compat/client.ts` — Hook `useTranslations`, `useLocale`, `NextIntlClientProvider`
- `src/i18n/compat/server.ts` — Server-side `getTranslations`, `getMessages`
- `src/i18n/runtime.ts` — `getPreferredLocale`, `isSupportedLocale` (browser)

**Usage** dalam komponen:

```tsx
import { useTranslations } from "@/i18n/compat/client";

function MyComponent() {
  const t = useTranslations("dashboard.resumes");
  return <h1>{t("create")}</h1>;
}
```

Detail tambah locale: lihat **[I18N.md](./I18N.md)**

---

## 🎯 Performance Considerations

### Bundle Splitting

Vite + Rollup melakukan automatic code splitting. Chunks utama:
- `main` (~1.1 MB) — React + TanStack + bulk komponen
- `pdf` (~459 KB) — pdfjs-dist (lazy loaded)
- `mermaid` (~1.4 MB) — diagram library (lazy loaded, hanya untuk certain templates)

### Lazy Loading

- PDF rendering (pdfjs-dist) hanya di-import saat user pakai fitur import PDF
- Template snapshots di-load on demand di dashboard
- Tiptap extensions sudah tree-shaken

### Storage Limits

- **LocalStorage**: ~5-10 MB. Cukup untuk ratusan CV teks-only. CV dengan banyak gambar (avatar, certificate) bisa cepat penuh.
- **IndexedDB**: tidak terbatas di browser modern.
- **File System Access**: dibatasi oleh disk lokal user.

### SSR vs CSR

- **SSR**: Landing page (`/`, `/$locale`)
- **CSR-only**: Semua route di `/app/*` (butuh LocalStorage)

Strategi ini bagus untuk SEO landing page dan privasi data user (CV tidak pernah di-render di server).

---

## 🔒 Security Notes

### API Keys

- API key user disimpan di **LocalStorage** (Zustand persist `cv-buff-ai-config`)
- API key dikirim dari client ke server kita di setiap request → server forward ke provider AI
- Server kita TIDAK menyimpan API key di disk / log / database
- API key tidak pernah masuk URL (query string) — selalu di request body atau header

### CORS

- API routes pakai default TanStack Start CORS (same-origin)
- `/api/proxy/image` adalah satu-satunya endpoint yang fetch external URL (untuk avatar URL eksternal). Validate URL pattern untuk hindari SSRF.

### XSS Protection

- Tiptap menggunakan controlled HTML output (whitelist tags)
- Resume preview render via React (otomatis HTML-escape)
- AI Polish output di-sanitize via `markdown-exit` (controlled markdown → HTML)

### Privacy

- Tidak ada analytics third-party (kecuali optional `@vercel/analytics` yang bisa dimatikan)
- Tidak ada cookies kecuali `NEXT_LOCALE` (untuk persist bahasa)
- Tidak ada error tracking (Sentry, etc.) yang otomatis kirim PII

---

## 🚦 Build & Runtime Lifecycle

### Dev (`pnpm dev`)

1. Vite start at port **1713** (strictPort)
2. TanStack Start plugin meng-handle SSR + file-based routing
3. Hot Module Replacement aktif

### Build (`pnpm build`)

1. Vite build client (`dist/client/`) — minified JS + CSS
2. Vite build SSR (`dist/server/`) — server entry + chunks
3. Static assets di-copy ke `dist/client/assets/`
4. Build time: ~25 detik (M1 / Ryzen 5)

### Production (`pnpm start`)

1. `server.mjs` start at port **1713** (atau `process.env.PORT`)
2. Static file resolver untuk `dist/client/`
3. Request lain di-handle oleh `dist/server/server.js` (TanStack Start SSR)

### Docker

`Dockerfile` multi-stage:
1. `deps` — install dependencies (cache mount)
2. `builder` — `pnpm build` + `pnpm prune --prod`
3. `runner` — minimal `node:20-alpine`, copy `node_modules` + `dist` + `server.mjs`. Run as non-root user `nodeapp`.

Image size: ~180 MB.

---

## 🧭 Navigasi Cepat ke Konsep

| Konsep | Lokasi File |
|---|---|
| Routing utama | `src/routes/` |
| State management | `src/store/` |
| Tipe data | `src/types/` |
| Constants | `src/config/` |
| Komponen UI | `src/components/` |
| Page komponen | `src/app/` |
| i18n | `src/i18n/` |
| Helper functions | `src/lib/`, `src/utils/` |
| Server-only (AI) | `src/lib/server/` |
| Custom hooks | `src/hooks/` |
| Styles | `src/styles/`, `src/app/globals.css` |
| Public assets | `public/` |

---

Untuk detail spesifik:
- AI provider system → **[AI-PROVIDERS.md](./AI-PROVIDERS.md)**
- i18n → **[I18N.md](./I18N.md)**
- Template baru → **[TEMPLATES.md](./TEMPLATES.md)**
- Setup dev → **[DEVELOPMENT.md](./DEVELOPMENT.md)**
- Deploy → **[DEPLOYMENT.md](./DEPLOYMENT.md)**
