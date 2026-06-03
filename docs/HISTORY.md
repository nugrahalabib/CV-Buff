# HISTORY.md — Catatan Sesi Pengembangan

> Dokumen ini mencatat keputusan, perubahan, dan konteks penting dari pengembangan CV-Buff. Tujuannya: AI assistant (Claude, dll.) di sesi mendatang bisa langsung paham status & sejarah project tanpa perlu menebak.

---

## 📅 Timeline Singkat

| Tanggal | Milestone |
|---|---|
| **2026-04-26** | Project dibangun dari nol sebagai CV-Buff (lihat detail di bawah) |
| **2026-04-26** | Rilis awal v0.1.0 di GitHub |
| **2026-04-27** | Lock port ke 1713 (strictPort), dev server stabil |
| **2026-06-04** | Dokumentasi lengkap (CLAUDE.md + docs/) + pemeliharaan kode |
| **2026-06-04** | Autentikasi: login **wajib Google** (better-auth + SQLite), guard `/app/*`, isolasi per-user, colokan SSO — lihat [docs/AUTH.md](./AUTH.md) |

---

## 🎬 KONTEKS AWAL (UNTUK CLAUDE BARU)

Project **CV-Buff** adalah aplikasi editor CV open-source untuk pasar Indonesia. Dibangun dengan tech stack modern (TanStack Start + React + TypeScript + Zustand + Tiptap + Tailwind), dengan filosofi privasi-pertama (semua data tersimpan lokal di browser).

Prinsip desain yang user tekankan berulang kali:
- **Brand**: CV-Buff, atas nama Nugraha Labib Mujaddid, lisensi MIT
- **Pasar**: Indonesia (locale `id` default, persona "Budi Santoso")
- **Locale & aset**: hanya `id` + `en`; font & AI provider dipilih sesuai pasar (tanpa unsur Tiongkok)
- **Port 1713 STRICT** — bukan 3000, bukan port lain
- **Privasi**: data CV tidak pernah ke server
- **AI provider extensible** — bukan vendor lock-in, user bisa pakai provider apa pun

---

## 🔨 KEPUTUSAN UTAMA & ALASANNYA

### 1. Lisensi MIT

**Alasan**: User ingin fleksibilitas maksimal — siapa pun (termasuk komersial) boleh pakai/modifikasi tanpa hambatan. MIT adalah lisensi paling permisif yang masih mempertahankan attribution requirement.

**Dampak**:
- `LICENSE`: MIT standard text dengan Copyright (c) 2026 Nugraha Labib Mujaddid
- `package.json`: `"license": "MIT"`
- README mention lisensi MIT

### 2. Locale `id` sebagai Default

**Alasan**: Target market utama Indonesia, dengan `en` sebagai opsi.

**Dampak**:
- `src/i18n/config.ts`: `defaultLocale = "id"`, `locales = ["id", "en"]`
- `Asia/Jakarta` sebagai timezone di `__root.tsx`
- Format tanggal default ke locale `id`
- `localStorage` key prefix `cv-buff-*`

### 3. Sistem AI Provider GENERIK (Registry-Based)

**Alasan**: User minta "kalau bisa bikin semua provider tinggal masuk aja, jadi bisa untuk semua". User tidak mau vendor lock-in.

**Arsitektur**:
- `src/config/ai/types.ts` — Interface `ProviderDefinition`:
  - `id`, `name`, `protocol` (`openai-compatible` | `anthropic` | `gemini`)
  - `endpoint`, `models[]`, `defaultModel`, `apiKey`, `selectedModel`
  - `authHeader`, `customHeaders`, `builtIn`
- `src/config/ai/builtin.ts` — 3 seed providers:
  - **OpenAI**: gpt-4o-mini default (bearer auth)
  - **Anthropic Claude**: claude-sonnet-4-6 default (x-api-key + anthropic-version)
  - **Google Gemini**: gemini-flash-latest default (x-goog-api-key)
- `src/store/useAIConfigStore.ts` — Registry-based Zustand store dengan `addCustomProvider`, `removeProvider`, `setActive`, `updateProvider`
- `src/app/app/dashboard/ai/page.tsx` — UI dengan left rail (list provider) + right pane (form). Tombol "+ Tambah Provider Custom" untuk Groq/OpenRouter/Ollama/dll.

**Anthropic Claude**: punya protocol berbeda dari OpenAI (system prompt di top-level field, max_tokens wajib, SSE event format berbeda). Adapter custom di `src/lib/server/anthropic.ts`.

### 4. Font: Plus Jakarta Sans Default (Google Fonts CDN)

**Alasan**: Plus Jakarta Sans adalah font modern open-source yang pas untuk pasar Indonesia.

**Set font final** (semua via Google Fonts CDN `@import` di `src/app/font.css`):
- **Plus Jakarta Sans** (default, sans-serif) — body text utama
- **Inter** (alt sans-serif) — modern minimal
- **Poppins** (alt sans-serif) — geometric
- **Lora** (serif) — untuk template editorial

### 5. Sample Resume Data: Persona "Budi Santoso"

**Alasan**: User minta persona realistis Indonesia (bukan generic "John Doe").

**Profil**:
- Nama: Budi Santoso
- Posisi: Senior Software Engineer
- Lokasi: Jakarta Selatan, DKI Jakarta
- Email: `budi.santoso@example.com`
- HP: `+62 812 3456 7890`
- Pendidikan: Universitas Indonesia, Ilmu Komputer (IPK 3.78, Cum Laude)
- Pengalaman:
  - Tokopedia — Senior Software Engineer (2022.03–sekarang)
  - Gojek — Software Engineer (2019.06–2022.02)
  - Traveloka — Junior Software Engineer (2017.08–2019.05)
- Proyek: Mitra Tokopedia POS, GoFood Merchant Dashboard, Pesan Kereta KAI Traveloka
- Skills: TypeScript, Go, Python, React/Next.js, AWS/GCP/K8s

Lokasi file: `src/config/initialResumeData.ts` (juga punya versi English untuk locale `en`).

### 6. Port 1713 STRICT (Hard Constraint)

**Alasan**: User EXPLICIT minta port 1713 — tidak boleh 3000, tidak boleh port lain. Bahkan jika 1713 dipakai, server harus error (bukan fallback).

**Dampak**:
- `vite.config.ts`: `port: 1713, strictPort: true` (dev + preview)
- `server.mjs`: default port 1713
- `Dockerfile`: `EXPOSE 1713`, `ENV PORT=1713`
- `docker-compose.yml`: mapping `1713:1713`
- `README.md`: semua URL & instruksi pakai `localhost:1713`

---

## 📜 RIWAYAT KOMIT (RINGKAS)

State sekarang (per 2026-06-04):

```
c958d5e chore: lock dev/preview/runtime port to 1713 (strictPort)
bfe7657 feat: initial release v0.1.0
```

**Commit `bfe7657`** = Rilis awal — berisi seluruh app: editor 3-panel, 8 template, sistem AI provider generik, i18n, sync folder lokal.

**Commit `c958d5e`** = Patch untuk lock port ke 1713 strictPort.

---

## 🛠️ PERUBAHAN PENTING PER FILE

### Konfigurasi root

| File | Catatan |
|---|---|
| `package.json` | `name: "cv-buff"`, `version: "0.1.0"`, `license: "MIT"`, `author: "Nugraha Labib Mujaddid"` |
| `vite.config.ts` | `port: 1713, strictPort: true` (dev + preview) |
| `Dockerfile` | EXPOSE & ENV PORT=1713 |
| `docker-compose.yml` | Port mapping `1713:1713` |
| `server.mjs` | Default port 1713 |
| `wrangler.toml` | `name = "cv-buff"` |
| `.github/workflows/docker-publish.yml` | `IMAGE_NAME: cv-buff` |
| `LICENSE` | MIT (Copyright 2026 Nugraha Labib Mujaddid) |
| `README.md` | Marketing copy lengkap, target pasar Indonesia |

### Sistem AI Provider

| File | Catatan |
|---|---|
| `src/config/ai/types.ts` | `ProviderDefinition`, `ProviderProtocol`, `isProviderConfigured`, `getEffectiveModel`, `buildAuthHeaders` |
| `src/config/ai/builtin.ts` | `BUILTIN_PROVIDERS` (openai, claude, gemini), `DEFAULT_PROVIDER_ID`, `cloneBuiltins` |
| `src/config/ai.ts` | Re-export dari `ai/types` & `ai/builtin` |
| `src/store/useAIConfigStore.ts` | Registry-based store: `providers[]`, `activeProviderId`, `addCustomProvider`, `removeProvider`, `setActive`, `updateProvider`, `getActive`, `isConfigured`. Persist key: `cv-buff-ai-config` |
| `src/routes/api/polish.ts` | Switch berdasarkan `provider.protocol` (anthropic, gemini, openai-compatible). System prompt Bahasa Indonesia. Streaming SSE. |
| `src/routes/api/grammar.ts` | Switch protocol, `coerceJsonPayload` helper. System prompt fokus typo + tanda baca Indonesia. |
| `src/routes/api/resume-import.ts` | Gemini Vision PDF parse, system prompt locale-aware |
| `src/lib/server/anthropic.ts` | `callAnthropic`, `createAnthropicTextStream` (parser SSE custom), `formatAnthropicErrorMessage` |
| `src/lib/server/gemini.ts` | Google GenAI SDK wrapper (dengan dukungan proxy) |
| `src/components/ai/icon/IconClaude.tsx`, `IconGemini.tsx`, `IconOpenAi.tsx` | Ikon provider built-in |
| `src/app/app/dashboard/ai/page.tsx` | UI registry-based: list provider + form detail + tombol Tambah Custom |
| `src/components/shared/ai/AIPolishDialog.tsx` | Pakai `getActive()` dari store |
| `src/store/useGrammarStore.ts` | Pakai `getActive()` |
| `src/hooks/useAIConfiguration.tsx` | Pakai `isConfigured()` dari store |

### Internasionalisasi (i18n)

| File | Catatan |
|---|---|
| `src/i18n/config.ts` | `locales = ["id", "en"]`, `defaultLocale = "id"` |
| `src/i18n/locales/id.json` | Full translation Bahasa Indonesia (default) |
| `src/i18n/locales/en.json` | Full translation English, struktur identik dengan `id.json` |
| `src/i18n/compat/server.ts` | Static MESSAGES map `{ id, en }` |
| `src/routes/__root.tsx` | Ternary `locale === "en" ? en : id`, `timeZone="Asia/Jakarta"` |
| `src/routes/$locale.tsx` | Locale-tag `id_ID`, alternateLocale `id`/`en` |
| `src/lib/utils.ts` | `formatDateString(date, locale="id")` default |

### Sample data & UI strings

| File | Catatan |
|---|---|
| `src/config/initialResumeData.ts` | Persona "Budi Santoso" (Tokopedia/Gojek/Traveloka), versi `id` + `en` |
| `src/config/constants.ts` | `DEFAULT_FIELD_ORDER`, `GITHUB_REPO_URL: nugrahalabib/CV-Buff`, `SERVER_URL: api.cv.agentbuff.id/generate-pdf` |
| `src/store/useResumeStore.ts` | Multi-resume store. Persist key: `cv-buff-resume-storage`. Title fallback `CV Baru`/`New Resume`, `Salinan`/`Copy` |
| `src/components/templates/*/config.ts` | `name` & `description` Bahasa Indonesia |

### Font system

| File | Catatan |
|---|---|
| `src/utils/fonts.ts` | `DEFAULT_FONT_FAMILY = "Plus Jakarta Sans"`, definitions 4 font (Plus Jakarta Sans, Inter, Poppins, Lora) via Google Fonts CDN |
| `src/app/font.css` | Single `@import url("...fonts.googleapis.com/css2?family=...")` untuk 4 font |
| `public/fonts/` | Kosong sengaja — semua font via CDN |

### Theme & branding UI

| File | Catatan |
|---|---|
| `src/app/providers.tsx` | `storageKey="cv-buff-theme"` |
| `src/app/layout.tsx` | `metadataBase: new URL("https://cv.agentbuff.id")` |
| `src/app/sitemap.ts` | `baseUrl = "https://cv.agentbuff.id/"`, routes `["id", "en"]` |
| `src/app/(public)/[locale]/layout.tsx` | `baseUrl = "https://cv.agentbuff.id"`, `alternateLocale: ["id"]` |
| `src/app/manifest.ts` | `name: "CV-Buff"`, `short_name: "CV-Buff"` |
| `src/components/shared/Logo.tsx` | `alt="CV-Buff Logo"` |
| `src/components/shared/GitHubStars.tsx` | `REPO_URL` & `API_URL` → `github.com/nugrahalabib/CV-Buff` |
| `src/components/home/Footer.tsx` | Render "CV-Buff" + copyright di footer |
| `public/logo.svg`, `src/assets/images/logo@2x.svg` | Text-mark "CV" minimalist (placeholder MVP) |
| `public/robots.txt`, `public/sitemap.xml` | Domain `cv.agentbuff.id`, locale `id`+`en` |
| `src/lib/templatePreview.ts` | `TEMPLATE_PREVIEW_LOCALES = ["id", "en"]` |

---

## 🎯 STATE PRODUCT SEKARANG

**Working features**:
- ✅ Landing page Bahasa Indonesia + English
- ✅ Dashboard untuk manage multi-CV
- ✅ Editor 3-panel real-time (side panel + edit panel + preview panel)
- ✅ 8 template responsive (Klasik, Dua Kolom, Linimasa, Minimalis, Elegan, Kreatif, Editorial, Latar Judul)
- ✅ AI Polish (streaming SSE, support OpenAI/Claude/Gemini/custom)
- ✅ AI Grammar Check (JSON response + Mark.js highlight)
- ✅ AI PDF Import (Gemini Vision parse PDF → struktur JSON)
- ✅ Custom AI Provider system (extensible untuk Groq/OpenRouter/Ollama/dll)
- ✅ Export PDF (server-side via api.cv.agentbuff.id) + JSON + Markdown + Browser Print
- ✅ Local storage + IndexedDB
- ✅ File System Access API sync ke folder lokal
- ✅ Auto-save (debounced 1.5s)
- ✅ Dark/Light mode
- ✅ Auto-fit ke 1 halaman
- ✅ Drag-drop reorder sections

**Yang BELUM ada (roadmap)**:
- ⬜ Online resume hosting (link publik dengan custom URL)
- ⬜ Cover letter generator AI
- ⬜ Job description matching AI
- ⬜ DOCX/LaTeX export
- ⬜ Template marketplace
- ⬜ Replace placeholder favicon/icon/web-shot dengan asset CV-Buff branded
- ⬜ Replace logo SVG dengan logo profesional (sekarang text-mark "CV" minimalist)
- ⬜ Deploy ke domain produksi `cv.agentbuff.id`
- ⬜ Bikin server PDF export di `api.cv.agentbuff.id/generate-pdf`
- ⬜ Generate ulang template snapshots (manifest saat ini kosong; folder `id/` belum ada)

---

## 🧠 INSIGHTS PENTING UNTUK SESI BERIKUTNYA

### Hal-hal yang mungkin terasa "aneh" tapi sebenarnya by design

1. **`src/app/` & `src/routes/` keduanya ada** — `src/routes/` adalah TanStack Start routes aktual (yang melayani request). `src/app/` adalah komponen page-level yang di-import oleh `routes/*.tsx`. Ini struktur project by design — JANGAN merge atau refactor tanpa alasan kuat.

2. **`src/config/ai.ts` re-export dari `src/config/ai/types.ts` & `src/config/ai/builtin.ts`** — untuk kenyamanan import path `@/config/ai`.

3. **`server.mjs` adalah custom HTTP server** — bukan pakai Vite preview. Production deployment pakai `pnpm build` lalu `node server.mjs`. Server ini handle static file + meneruskan request ke `dist/server/server.js` (TanStack Start SSR handler).

4. **`public/fonts/` kosong sengaja** — semua font via Google Fonts CDN. Kalau ingin self-host nanti, edit `src/app/font.css` (ganti @import dengan @font-face) dan `src/utils/fonts.ts` (URL ke `/fonts/*.woff2`).

5. **`src/generated/templateSnapshotManifest.ts` di-generate oleh script** — jalankan `pnpm generate:template-snapshots` setelah install Playwright (`pnpm install:playwright`). Akan render thumbnail untuk 8 template × 2 locale = 16 PNG di `public/template-snapshots/`. (Saat ini manifest masih kosong.)

6. **`.env` hanya berisi `FONTCONFIG_PATH=/var/task/fonts`** — untuk serverless lambda (Vercel/Cloudflare). Tidak butuh `.env.local` untuk dev biasa.

### Standar yang harus dipertahankan

- **Privasi**: jangan tambah analytics, tracking, atau cloud storage tanpa ijin
- **Kode bersih**: konvensi TypeScript ketat, no `any` kecuali terpaksa
- **i18n disiplin**: semua user-facing string lewat `t()`, tidak ada hardcoded
- **Test sebelum claim selesai**: `pnpm build` + `pnpm dev` + manual UI check
- **Folder structure**: jangan utak-atik tanpa alasan kuat — sudah well-organized

---

## 📞 REKOMENDASI KOMUNIKASI DENGAN USER

- User komunikasi dalam **Bahasa Indonesia** dengan tone informal-friendly
- User suka **detail** dan butuh **verification visible** (grep results, build success, dll.)
- User punya **standar tinggi** soal cleanliness kode
- User suka **autonomy & efficiency** — lebih suka AI yang jalan sampai selesai daripada nanya banyak hal
- Saat memberi token GitHub, user pasti minta verifikasi token tidak tersimpan di config

**Tone yang dianjurkan**:
- Bahasa Indonesia (kecuali user explicitly minta English)
- Direct & informative (no fluff)
- Tampilkan tabel verifikasi setelah selesai task besar
- Klarifikasi sebelum aksi destructive (delete, force-push, dll.)

---

## 🔚 PENUTUP

CV-Buff adalah project yang sudah **production-grade** secara kualitas kode dan fitur. Pekerjaan utama yang tersisa adalah **deployment ke production domain** dan **expansion fitur baru** (cover letter, online hosting, dll.).

State final di GitHub: `https://github.com/nugrahalabib/CV-Buff` (main: `c958d5e`).

Selamat melanjutkan! 🚀
