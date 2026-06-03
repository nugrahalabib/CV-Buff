# CLAUDE.md — Master Entry Point untuk AI Coding Assistant

> **Untuk Claude / AI coding assistant lain**: file ini adalah dokumen utama yang harus Anda baca pertama kali ketika memulai sesi pengembangan di project CV-Buff. Semua konteks penting, keputusan arsitektur, konvensi kode, dan pointer ke dokumentasi lain ada di sini.
>
> **Untuk manusia (developer)**: file ini juga membantu Anda jika Anda baru bergabung ke project — atau jika Anda kembali ke project setelah lama tidak menyentuhnya.

---

## 🎯 RINGKASAN PROJECT (1 paragraf)

**CV-Buff** adalah editor CV (resume) open-source berbasis web yang dibangun dengan **TanStack Start + React 18 + TypeScript + Vite**. Project ini menonjolkan **privasi-pertama** (semua data CV tersimpan di LocalStorage + IndexedDB browser, tidak ada server-side database), **AI-driven** (fitur Polish text & Grammar Check via OpenAI / Anthropic Claude / Google Gemini, plus extensible custom provider system), dan **8 template profesional** dengan editor real-time WYSIWYG 3-panel. Brand & lisensi atas nama **Nugraha Labib Mujaddid** dengan lisensi **MIT**. Target market utama: **Indonesia** (locale `id` default + `en` sebagai opsi). Project ini **karya original** dan dirilis sebagai open-source di bawah lisensi MIT.

---

## 📍 INFORMASI INSTAN (KEY FACTS)

| Item | Nilai |
|---|---|
| **Nama project** | CV-Buff |
| **Package name** | `cv-buff` |
| **Version** | `0.1.0` |
| **Owner / Author** | Nugraha Labib Mujaddid |
| **License** | MIT |
| **GitHub repo** | https://github.com/nugrahalabib/CV-Buff |
| **Default branch** | `main` |
| **Local path (Windows)** | `c:/Users/nugra/Documents/Project/Agentbuff-App/CV-Buff/` |
| **Production domain** (placeholder) | `https://cv.agentbuff.id` |
| **Dev / Build / Runtime port** | **1713** (strict — TIDAK BOLEH diganti tanpa ijin user) |
| **Package manager** | `pnpm@10.3.0` (WAJIB — bukan npm/yarn) |
| **Node version target** | 20+ (lockfile dibuat dengan Node 20) |
| **Default locale** | `id` (Bahasa Indonesia) |
| **Supported locales** | `id`, `en` |
| **Timezone** | `Asia/Jakarta` |
| **Default font** | Plus Jakarta Sans (via Google Fonts CDN) |
| **Default AI provider** | OpenAI (id: `openai`, model: `gpt-4o-mini`) |
| **Storage key prefix** | `cv-buff-*` (LocalStorage Zustand persist) |

---

## 🏛️ TECH STACK (RINGKAS)

```
Framework:       TanStack Start 1.16 (file-based routing, SSR-ready)
Build tool:      Vite 7.3 (port 1713 strictPort)
UI:              React 18 + TypeScript 5
Styling:         Tailwind CSS 3.4 + shadcn/ui + HeroUI + Radix primitives
State:           Zustand 4.5 (persist middleware → LocalStorage)
Editor:          Tiptap 3 (rich text + AI Polish trigger)
Animation:       Framer Motion 11
Icons:           Lucide React + Remix Icon
PDF:             Puppeteer + @sparticuz/chromium + html2pdf.js (fallback)
i18n:            Custom compat layer (next-intl style API), id + en
AI Providers:    OpenAI, Anthropic Claude, Google Gemini + extensible custom slot
Storage:         LocalStorage (Zustand) + IndexedDB (File System Access handle)
Sync:            File System Access API → folder lokal pengguna
Deployment:      Docker / Cloudflare Workers / Vercel / Node VPS
```

Untuk daftar dependency lengkap & alasan pilih, lihat **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.

---

## 🚀 QUICK START (bagi siapa pun yang baru lihat repo)

```bash
# Prerequisites: Node.js 20+, pnpm 10+
git clone https://github.com/nugrahalabib/CV-Buff.git
cd CV-Buff
pnpm install                  # install dependencies (~40 detik)
pnpm dev                      # dev server di http://localhost:1713

# Production:
pnpm build                    # build ke dist/
pnpm start                    # serve build via Node HTTP server (server.mjs)

# Docker:
docker compose up -d          # akan expose port 1713

# Generate template snapshots (preview thumbnails):
pnpm install:playwright       # install chromium binary (sekali saja)
pnpm generate:template-snapshots
```

**PENTING**: Port **1713** dikunci dengan `strictPort: true` di [vite.config.ts](./vite.config.ts). Jika 1713 sudah dipakai, Vite akan **error** (bukan fallback). Ini adalah kesengajaan — user EXPLICIT minta tidak boleh pakai port lain.

---

## 📂 STRUKTUR FOLDER (PETA NAVIGASI)

```
CV-Buff/
├── CLAUDE.md                       ← FILE INI (master entry untuk AI assistant)
├── README.md                       ← Marketing copy untuk publik di GitHub
├── LICENSE                         ← MIT License (Copyright 2026 Nugraha Labib Mujaddid)
├── package.json                    ← name: "cv-buff", license: "MIT", scripts
├── pnpm-lock.yaml                  ← LOCKFILE (jangan diutak-atik manual)
├── tsconfig.json                   ← path aliases @/*  → src/*
├── vite.config.ts                  ← Port 1713 strictPort, plugins TanStack Start + React
├── tailwind.config.ts              ← Tailwind config
├── postcss.config.mjs              ← PostCSS dengan postcss-normalize
├── components.json                 ← shadcn/ui config
├── Dockerfile                      ← Multi-stage build → port 1713
├── docker-compose.yml              ← Mapping 1713:1713
├── docker-publish.yml              ← (di .github/workflows/)
├── wrangler.toml                   ← Cloudflare Workers config
├── server.mjs                      ← Custom Node HTTP server (production, port 1713)
├── bump.config.ts                  ← bumpp (release tool) config
├── .env                            ← FONTCONFIG_PATH (untuk lambda)
├── docs/                           ← DOKUMENTASI LENGKAP (lihat section di bawah)
│   ├── ARCHITECTURE.md             ← Arsitektur teknis: framework, state, routing
│   ├── AI-PROVIDERS.md             ← Sistem registry AI provider (CRUCIAL)
│   ├── DEVELOPMENT.md              ← Setup dev, konvensi kode, struktur file
│   ├── DEPLOYMENT.md               ← Deploy ke Docker/Cloudflare/Vercel/VPS
│   ├── I18N.md                     ← Cara nambah locale baru, struktur translation
│   ├── TEMPLATES.md                ← Cara bikin template CV baru
│   └── HISTORY.md                  ← Catatan sesi pengembangan (lihat di bawah)
├── public/
│   ├── logo.svg                    ← Logo CV-Buff (text-mark "CV" bulatan)
│   ├── icon.png, favicon.ico       ← (PLACEHOLDER — user perlu replace dengan branded asset)
│   ├── avatar.png                  ← Avatar default untuk CV
│   ├── web-shot.png                ← OG image (PLACEHOLDER)
│   ├── robots.txt                  ← Pointing ke cv.agentbuff.id
│   ├── sitemap.xml                 ← Sitemap statis (id + en)
│   ├── fonts/                      ← KOSONG — semua font via Google Fonts CDN
│   ├── features/                   ← SVG ilustrasi feature section (polish, grammar)
│   └── template-snapshots/         ← Generated thumbnails per template (id + en)
├── scripts/
│   └── generate-template-snapshots.ts  ← Playwright script untuk render thumbnail
├── src/
│   ├── routes/                     ← TanStack Start file-based routing
│   │   ├── __root.tsx              ← Root layout, i18n provider, timeZone Asia/Jakarta
│   │   ├── index.tsx               ← / → redirect ke /id
│   │   ├── $locale.tsx             ← /[locale] landing page (SEO meta)
│   │   ├── api/                    ← API endpoints (server handlers)
│   │   │   ├── polish.ts           ← POST /api/polish (streaming SSE)
│   │   │   ├── grammar.ts          ← POST /api/grammar (JSON response)
│   │   │   ├── resume-import.ts    ← POST /api/resume-import (Gemini PDF parse)
│   │   │   └── proxy/image.ts      ← Image proxy untuk CORS
│   │   └── app/
│   │       ├── dashboard.tsx       ← Wrapper /app/dashboard
│   │       ├── dashboard/
│   │       │   ├── index.tsx       ← Redirect ke /resumes
│   │       │   ├── resumes.tsx     ← List CV
│   │       │   ├── templates.tsx   ← Template gallery
│   │       │   ├── settings.tsx    ← Sync directory config
│   │       │   └── ai.tsx          ← AI Provider config UI (REGISTRY GENERIK)
│   │       ├── workbench/$id.tsx   ← Editor 3-panel
│   │       ├── preview-template/$id.tsx  ← Standalone template preview
│   │       └── index.tsx           ← Redirect /app → /app/dashboard
│   ├── app/                        ← Pages (dipasangkan dengan routes/)
│   │   ├── globals.css             ← Global styles + Tailwind layers
│   │   ├── font.css                ← @import Google Fonts (Plus Jakarta Sans, Inter, Poppins, Lora)
│   │   ├── manifest.ts             ← PWA manifest (name: CV-Buff)
│   │   ├── sitemap.ts              ← Dynamic sitemap (id + en)
│   │   ├── layout.tsx              ← Root metadata (metadataBase: cv.agentbuff.id)
│   │   ├── providers.tsx           ← HeroUIProvider + next-themes + resume directory sync
│   │   ├── (public)/[locale]/      ← Landing page components
│   │   └── app/                    ← Dashboard + workbench page components
│   ├── components/
│   │   ├── ai/icon/                ← IconOpenAi, IconClaude, IconGemini (built-in providers)
│   │   ├── editor/                 ← Form editor 12 sections
│   │   ├── home/                   ← Landing page sections (hero, FAQ, CTA, footer)
│   │   ├── preview/                ← Real-time preview + PreviewDock
│   │   ├── templates/              ← 8 template implementations
│   │   │   ├── registry.ts         ← Single source of truth daftar template
│   │   │   ├── classic/            ← Template Klasik
│   │   │   ├── modern/             ← Template Dua Kolom
│   │   │   ├── left-right/         ← Template Latar Judul Bagian
│   │   │   ├── timeline/           ← Template Linimasa
│   │   │   ├── minimalist/         ← Template Minimalis
│   │   │   ├── elegant/            ← Template Elegan
│   │   │   ├── creative/           ← Template Kreatif
│   │   │   ├── editorial/          ← Template Editorial
│   │   │   └── shared/             ← Shared section components
│   │   ├── shared/                 ← PdfExport, ThemeToggle, GitHubStars, Logo, dll.
│   │   ├── ui/                     ← shadcn/ui primitives (Button, Card, Input, etc.)
│   │   ├── magicui/                ← magic UI components (Dock)
│   │   └── mobile/                 ← MobileWorkbench (responsive variant)
│   ├── store/                      ← Zustand stores
│   │   ├── useResumeStore.ts       ← Multi-resume + persist key: "cv-buff-resume-storage"
│   │   ├── useAIConfigStore.ts     ← Provider registry + persist key: "cv-buff-ai-config"
│   │   └── useGrammarStore.ts      ← Grammar errors + Mark.js highlights
│   ├── types/                      ← TypeScript: ResumeData, BasicInfo, GlobalSettings, Template
│   ├── config/                     ← Config
│   │   ├── ai.ts                   ← Re-export dari ai/types & ai/builtin
│   │   ├── ai/
│   │   │   ├── types.ts            ← ProviderDefinition, isProviderConfigured, buildAuthHeaders
│   │   │   └── builtin.ts          ← BUILTIN_PROVIDERS: OpenAI, Claude, Gemini
│   │   ├── constants.ts            ← DEFAULT_FIELD_ORDER + GITHUB_REPO_URL + PDF_EXPORT_CONFIG
│   │   ├── initialResumeData.ts    ← Persona "Budi Santoso" (Tokopedia/Gojek/Traveloka)
│   │   ├── modules.ts              ← STANDARD_MODULES (skills, experience, dll.)
│   │   ├── faq.tsx                 ← FAQ items
│   │   └── index.ts                ← Public API: DEFAULT_TEMPLATES + constants
│   ├── i18n/                       ← Internationalization
│   │   ├── config.ts               ← locales: ["id","en"], defaultLocale: "id"
│   │   ├── runtime.ts              ← getPreferredLocale, isSupportedLocale
│   │   ├── locales/
│   │   │   ├── id.json             ← Bahasa Indonesia (default, ~820 keys)
│   │   │   └── en.json             ← English
│   │   └── compat/                 ← next-intl compat layer
│   ├── hooks/                      ← Custom hooks
│   │   ├── useAIConfiguration.tsx  ← Cek isConfigured, toast prompt
│   │   ├── useAutoOnePage.ts       ← Auto-fit ke 1 halaman A4
│   │   ├── useGrammarCheck.ts      ← Wrapper around useGrammarStore
│   │   └── useTemplateSnapshots.ts ← Load template thumbnails
│   ├── lib/                        ← Helpers & server-only utilities
│   │   ├── utils.ts                ← cn(), formatDateString (locale=id default)
│   │   ├── image.tsx, link.tsx, navigation.ts ← Wrapper komponen
│   │   ├── richText.ts             ← Rich text helpers
│   │   ├── templatePreview.ts      ← Helper untuk snapshot manifest
│   │   ├── customField.ts, projectLink.ts ← Validator
│   │   └── server/                 ← Server-only
│   │       ├── auth.ts             ← better-auth instance (login Google)
│   │       ├── authProviders.ts    ← registry provider (colokan SSO)
│   │       ├── requireUser.ts      ← guard API per-user
│   │       ├── db.ts               ← Postgres pool + tabel resume
│   │       ├── resumeRepo.ts       ← CRUD CV per-user (Postgres)
│   │       ├── gemini.ts           ← Google GenAI SDK wrapper (with proxy support)
│   │       └── anthropic.ts        ← Anthropic Messages API + SSE parser
│   ├── utils/                      ← Pure functions
│   │   ├── export.ts               ← Export PDF (server-side) + JSON + Markdown
│   │   ├── fonts.ts                ← Font definitions (Plus Jakarta Sans default)
│   │   ├── imageUtils.ts           ← Resize, crop
│   │   ├── markdown.ts             ← Markdown converter
│   │   ├── print.ts                ← Browser print → PDF
│   │   └── uuid.ts                 ← generateUUID()
│   ├── actions/
│   │   └── navigation.ts           ← Server actions
│   ├── styles/
│   │   └── tiptap.scss             ← Tiptap editor styles
│   ├── theme/                      ← Theme definitions
│   ├── generated/
│   │   └── templateSnapshotManifest.ts ← Generated by scripts/
│   └── assets/
│       └── images/
│           ├── logo@2x.svg         ← Logo 2x untuk small displays
│           └── template-cover/     ← Template cover images
└── .github/
    ├── workflows/
    │   ├── docker-publish.yml      ← Auto build & push Docker image (IMAGE_NAME: cv-buff)
    │   ├── deploy.yml              ← Deploy ke Cloudflare via wrangler
    │   └── release.yml             ← changelogen GitHub release
    └── FUNDING.yml                 ← DIHAPUS (tidak ada sponsorship)
```

---

## 🔥 KEPUTUSAN ARSITEKTUR PENTING (READ CAREFULLY)

### 1. **Port 1713 STRICT — JANGAN DIUBAH**

User EXPLICIT minta port harus 1713 — bukan 3000, bukan port lain. `vite.config.ts` punya `strictPort: true` agar dev server **GAGAL start** (bukan fallback) bila port sudah dipakai. Semua file yang reference port (Dockerfile, docker-compose.yml, server.mjs, README.md) sudah aligned ke 1713.

### 2. **AI Provider System adalah REGISTRY GENERIK**

Ini bukan "OpenAI saja" atau "Gemini saja" — user bisa add provider apa pun.

**Architecture**:
- `src/config/ai/types.ts` — `ProviderDefinition` interface (id, name, protocol, endpoint, models, apiKey, dll)
- `src/config/ai/builtin.ts` — 3 built-in: `openai`, `claude`, `gemini`
- `src/store/useAIConfigStore.ts` — Zustand store dengan registry-based state. User bisa `addCustomProvider()` untuk Groq/OpenRouter/Ollama/dll
- `src/routes/api/polish.ts` & `grammar.ts` — switch berdasarkan `provider.protocol` (`openai-compatible` | `anthropic` | `gemini`)
- `src/lib/server/anthropic.ts` — Adapter custom untuk Anthropic Messages API (SSE format beda dari OpenAI)
- `src/lib/server/gemini.ts` — Google GenAI SDK wrapper

**JANGAN tambah provider AI dari Tiongkok apa pun** (mis. domain `*.cn` / `volces.com`).

Detail: **[docs/AI-PROVIDERS.md](./docs/AI-PROVIDERS.md)**

### 3. **Storage Model — CV di Server (per-akun), API Key tetap di Browser**

- **Wajib login Google** untuk akses `/app/*` (better-auth + **PostgreSQL** self-hosted di VPS, DB `cvbuff` di `postgres_container`). DB menyimpan identitas (profil Google) **dan** tabel `resume` (isi CV) — keduanya di-scope per `user.id`. Koneksi via `pg` Pool di `src/lib/server/db.ts`.
- **Data CV → server**: tabel `resume`, API `/api/resumes` (+ `/api/resumes/$id`) dijaga `requireUser()` + cek kepemilikan. `useResumeStore` memuat via `loadResumes()` saat masuk `/app`, auto-save debounced (PUT) via subscribe. CV sampai ke perangkat **HANYA** saat download/export.
- **AI config + API key user → tetap di browser** (LocalStorage `cv-buff-ai-config`), **TIDAK PERNAH ke server** (keamanan). Theme di `cv-buff-theme`.
- **Isolasi penuh**: tiap query CV `WHERE userId = session.user.id`; tidak ada endpoint melisting user; tidak ada user yang bisa baca/timpa/hapus CV user lain.
- API routes (`/api/polish|grammar|resume-import`) proxy ke provider AI (pakai apiKey user dari body) + dijaga `requireUser()`.
- Server-only env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `DATABASE_URL` (Postgres; lihat `.env.example`). Dev lokal pakai SSH tunnel ke Postgres VPS (`ssh -L 55432:localhost:5432 agentbuff-vps`). Auth+DB = deploy **Node/Docker**. Detail: **[docs/AUTH.md](./docs/AUTH.md)**.

**KONSEKUENSI**: app butuh **online + login** untuk akses CV (tidak lagi offline); CV tersinkron otomatis lintas perangkat selama login akun yang sama. Fitur sync folder lokal (File System Access) sudah **dihapus**.

### 4. **Lokalisasi: Default `id`, Support `en`**

- `src/i18n/config.ts`: `defaultLocale = "id"`, `locales = ["id", "en"]`
- Translasi: `src/i18n/locales/id.json` & `en.json` (struktur identik)
- TimeZone: `Asia/Jakarta` (hardcoded di `__root.tsx`)
- Format tanggal: `formatDateString(date, locale="id")` di `src/lib/utils.ts`
- Sample resume data: persona Indonesia ("Budi Santoso") di `src/config/initialResumeData.ts`
- **JANGAN add locale `zh` (Mandarin)** — user explicit minta tidak boleh ada unsur Tiongkok

### 5. **Font: Google Fonts CDN — TIDAK Self-Host**

`public/fonts/` **kosong** secara sengaja. Semua font (Plus Jakarta Sans default, Inter, Poppins, Lora) di-import via `@import url("...fonts.googleapis.com...")` di `src/app/font.css`. Detail definition di `src/utils/fonts.ts`.

**JANGAN tambah font Tiongkok** (Alibaba PuHuiTi, MiSans, Noto Sans SC, Source Han) — user explicit minta tidak ada.

### 6. **Brand: CV-Buff oleh Nugraha Labib Mujaddid, MIT License**

- Footer copyright: `© 2026 CV-Buff oleh Nugraha Labib Mujaddid`
- `package.json`: `name: cv-buff`, `version: 0.1.0`, `license: MIT`, `author: Nugraha Labib Mujaddid`
- LICENSE: MIT standard text
- **JANGAN sebut project lain di mana pun** — README, code, commit message, dll. User explicit minta TIDAK ada atribusi ke project mana pun di GitHub.

---

## ⛔ HAL YANG TIDAK BOLEH DILAKUKAN

1. ❌ Mengganti port dari 1713 ke port lain
2. ❌ Menambah provider AI dari Tiongkok (mis. domain `*.cn` / `volces.com`)
3. ❌ Menambah locale `zh` atau font Tiongkok
4. ❌ Menyebut nama project lain mana pun di README, code, commit message, atau docs
5. ❌ Memakai `npm` atau `yarn` — WAJIB `pnpm`
6. ❌ Mengubah storage key `cv-buff-*` (akan break user existing data)
7. ❌ Push token GitHub ke repo (gunakan inline auth + clean remote URL)
8. ❌ Memberi atribusi/kredit ke kontributor atau proyek lain di mana pun (project ini 100% karya original Nugraha Labib Mujaddid)
9. ❌ Menambah dependency baru tanpa konfirmasi user dulu
10. ❌ Push langsung ke `main` tanpa testing build + dev lokal

---

## ✅ WORKFLOW YANG DIANJURKAN

### Saat memulai sesi baru

1. **Baca file ini (CLAUDE.md) lengkap**
2. Baca **[docs/HISTORY.md](./docs/HISTORY.md)** untuk konteks sesi pengembangan sebelumnya
3. Cek state repo:
   ```bash
   cd "c:/Users/nugra/Documents/Project/Agentbuff-App/CV-Buff"
   git status        # CATATAN: working copy saat ini BELUM di-init git (tidak ada .git)
   git log --oneline -10
   git remote -v
   ```
   > ⚠️ **State sekarang**: folder ini **bukan git repository** (`.git` tidak ada). Semua langkah workflow yang menyebut `git checkout -b`, `git commit`, `git push` di bawah baru relevan setelah `git init` + `git remote add origin ...` dijalankan. Jangan asumsikan ada branch/remote sampai dikonfirmasi.
4. Pastikan dependencies installed:
   ```bash
   pnpm install     # idempotent, aman dijalankan ulang
   ```

### Saat membuat fitur baru

1. Bikin branch: `git checkout -b feat/nama-fitur`
2. Implementasi + testing lokal: `pnpm dev` → cek di `http://localhost:1713`
3. Verify production build: `pnpm build`
4. Commit dengan conventional message: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
5. Tanya user dulu sebelum push ke `main`

### Saat menambah AI Provider built-in baru (rare)

1. Edit `src/config/ai/builtin.ts` — tambah entry `ProviderDefinition`
2. Bila protocol baru (bukan `openai-compatible`/`anthropic`/`gemini`):
   - Edit `src/config/ai/types.ts` — tambah `ProviderProtocol` literal
   - Buat handler baru di `src/routes/api/polish.ts` & `grammar.ts`
   - Buat adapter di `src/lib/server/<provider>.ts`
3. Bila pakai protocol yang sudah ada, cukup edit `builtin.ts`
4. (Opsional) Buat icon di `src/components/ai/icon/Icon<Provider>.tsx`
5. Daftarkan icon di `src/app/app/dashboard/ai/page.tsx` `PROVIDER_ICONS`

### Saat menambah template CV baru (10 menit kerjaan)

1. Buat folder `src/components/templates/<nama-template>/`
2. Bikin `config.ts` (ResumeTemplate object) & `index.tsx` (komponen)
3. Bikin `sections/*.tsx` (BaseInfo, ExperienceSection, dll.)
4. Register di `src/components/templates/registry.ts`
5. Tambahkan label di `id.json` & `en.json` (`dashboard.templates.<nama>`)
6. Template otomatis muncul di gallery

Detail: **[docs/TEMPLATES.md](./docs/TEMPLATES.md)**

---

## 📚 DOKUMEN-DOKUMEN PENTING (BACA SESUAI KEBUTUHAN)

| File | Kapan baca? |
|---|---|
| **[CLAUDE.md](./CLAUDE.md)** | FILE INI — selalu pertama |
| **[README.md](./README.md)** | Untuk lihat marketing copy publik |
| **[docs/HISTORY.md](./docs/HISTORY.md)** | Konteks sesi pengembangan sebelumnya |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Sebelum bikin perubahan arsitektur besar |
| **[docs/AI-PROVIDERS.md](./docs/AI-PROVIDERS.md)** | Sebelum sentuh sistem AI |
| **[docs/AUTH.md](./docs/AUTH.md)** | Sebelum sentuh login/auth (Google OAuth, SSO, isolasi user) |
| **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** | Sebelum coding harian (konvensi, struktur) |
| **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** | Saat deploy ke production |
| **[docs/I18N.md](./docs/I18N.md)** | Saat nambah locale atau translasi |
| **[docs/TEMPLATES.md](./docs/TEMPLATES.md)** | Saat bikin template CV baru |

---

## 🔑 INFO USER & CREDENTIALS

- **Email user**: `agentbuff.id@gmail.com`
- **GitHub username**: `nugrahalabib`
- **Path local repo**: `c:/Users/nugra/Documents/Project/Agentbuff-App/CV-Buff/`
- **Shell**: PowerShell (Windows 11). Bash juga tersedia bila perlu skrip POSIX. Pakai sintaks PowerShell untuk perintah harian (`$env:VAR`, `$null`, backtick untuk line-continuation).
- **GitHub token PAT**: **TIDAK DI-SIMPAN DI MANA PUN DALAM REPO**. User memberi token via chat saat butuh push. Pakai inline auth (`git push "https://x-access-token:TOKEN@github.com/..."`) lalu set remote URL ke versi clean.
- **Time zone user**: Asia/Jakarta (WIB)

---

## 🧪 TESTING & VERIFIKASI

> **Tidak ada test runner & tidak ada script `lint`/`test`/`typecheck`.** `package.json` scripts hanya: `dev`, `build`, `start`, `preview`, `release`, `generate:template-snapshots`, `install:playwright`. Karena itu **`pnpm build` adalah satu-satunya gate type-check otomatis** (Vite + TanStack Start akan gagal build bila ada error TypeScript). Ada `.eslintrc.json` (`extends: next/core-web-vitals`) tapi tanpa script — jalankan manual via `pnpm exec eslint src` bila perlu. Jangan mencari `pnpm test`; tidak ada.

Sebelum claim "selesai":

```bash
# 1. Production build (SATU-SATUNYA gate type-check otomatis)
pnpm build

# 2. Dev server boot test
pnpm dev   # harus jadi di http://localhost:1713

# 3. HTTP response test
curl -sSL -o /tmp/out.html -w "HTTP %{http_code}\n" http://localhost:1713/
grep -oE "<title[^>]*>[^<]*</title>" /tmp/out.html   # → "CV-Buff - Editor CV Berbasis AI"

# 4. Static grep: tidak boleh ada jejak Tiongkok (karakter CJK, timezone, domain provider)
cd src && grep -rEln "[一-鿿]|Asia/Shanghai|volces\.com|zh-CN" . | head -5
# (output harus KOSONG)
```

---

## 🚨 PENTING — SESI INI

**Tanggal sesi terakhir**: 2026-06-04
**Status terakhir**: Project sudah live di GitHub, port 1713 strict, dev server jalan, dokumentasi lengkap di-commit.

Untuk **detail step-by-step semua keputusan & perubahan di sesi pengembangan sampai sekarang**, baca:

👉 **[docs/HISTORY.md](./docs/HISTORY.md)**

File itu berisi:
- Konteks & prinsip desain project
- Semua keputusan arsitektur (AI provider, i18n, font, sample data)
- Catatan perubahan penting per file
- State produk sekarang + roadmap
- Hal-hal yang user spesifik minta (port 1713, privasi, dll.)

---

## 🎁 PENUTUP UNTUK AI ASSISTANT BERIKUTNYA

Jika Anda Claude (atau AI lain) yang membaca ini di sesi baru:

1. Project ini **production-ready** — bisa langsung di-dev / di-build / di-deploy
2. Brand & lisensi **clean** atas nama Nugraha Labib Mujaddid (MIT)
3. **Repo GitHub** sudah live di https://github.com/nugrahalabib/CV-Buff — tidak ada jejak project lain di history-nya
4. **Port 1713** adalah hard constraint dari user. Jangan utak-atik.
5. **Privasi pengguna** adalah core value. Jangan tambah cloud storage / tracking / analytics tanpa ijin eksplisit user.
6. User ini **detail-oriented & punya standar tinggi** — verify semua perubahan dengan grep, build, dan dev test sebelum claim selesai.

Selamat coding! 🚀
