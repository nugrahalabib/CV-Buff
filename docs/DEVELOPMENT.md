# DEVELOPMENT.md — Setup Development & Konvensi Kode

> Panduan untuk developer / AI assistant yang akan ngoding di CV-Buff. Berisi setup environment, konvensi, dan workflow harian.

---

## 🛠️ Setup Environment

### Prerequisites

- **Node.js** 20+ (test dengan `node -v` → `v20.x.x` atau lebih)
- **pnpm** 10+ (install global: `npm i -g pnpm`)
- **Git** (untuk version control)
- **VS Code** (recommended editor)
- **Chrome / Edge** (untuk testing — File System Access API butuh Chromium-based)

### Clone & Install

```bash
git clone https://github.com/nugrahalabib/CV-Buff.git
cd CV-Buff
pnpm install                    # ~40-60 detik
```

### Jalankan Dev Server

```bash
pnpm dev                         # http://localhost:1713
```

**PENTING**: Port **1713** dikunci dengan `strictPort: true`. Jika 1713 sudah dipakai oleh proses lain, server akan **error** (bukan fallback). Cek port:

```bash
# Windows
netstat -ano | grep ":1713"

# kill node process
taskkill //F //IM node.exe
```

### Build & Production

```bash
pnpm build                       # build ke dist/
pnpm start                       # serve dist/ via Node HTTP server (port 1713)
pnpm preview                     # alternative: serve via Vite preview
```

### Template Snapshot Generator (Optional)

Untuk regenerate thumbnail template di gallery:

```bash
pnpm install:playwright          # install Chromium binary (sekali saja)
pnpm generate:template-snapshots # render 8 template × 2 locale = 16 PNG
```

Output ke `public/template-snapshots/{id,en}/{templateId}.png` + manifest di `src/generated/templateSnapshotManifest.ts`.

---

## 📁 Konvensi Folder

Lihat **[CLAUDE.md](../CLAUDE.md)** section "Struktur Folder" untuk peta lengkap.

Singkatnya:

```
src/
├── routes/       ← TanStack Start route files (server-side routing)
├── app/          ← Page components (di-import oleh routes/)
├── components/   ← Reusable UI components
├── store/        ← Zustand state stores
├── types/        ← TypeScript types & interfaces
├── config/       ← Configuration, constants, seed data
├── i18n/         ← Internationalization
├── lib/          ← Helpers & server-only utilities
├── utils/        ← Pure functions (no React deps)
├── hooks/        ← Custom React hooks
├── styles/       ← Global SCSS files
└── assets/       ← Static images (imported)
```

**Tip**: Jika ragu, taruh file di folder yang paling sering pakai. Jangan over-organize.

---

## 🎨 TypeScript & Path Aliases

`tsconfig.json` mendefinisikan alias:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Pakai alias untuk avoid relative path neraka:

```ts
// ❌ HINDARI
import { Button } from "../../../components/ui/button";

// ✅ PAKAI
import { Button } from "@/components/ui/button";
```

`vite-tsconfig-paths` plugin handle ini di Vite + TanStack Start.

---

## 🧩 Konvensi Penulisan Komponen

### Default: Server-Side Components (TanStack Start)

TanStack Start mendukung SSR. Komponen default bisa render di server.

### Client-Only Components

Bila pakai hooks (useState, useEffect, dll.) atau browser API (localStorage), komponen jadi client-only otomatis.

Tidak perlu `"use client"` directive (seperti Next.js App Router). TanStack Start handle ini berdasarkan import graph.

### Komponen UI

Pakai pattern shadcn/ui:

```tsx
// ✅ Pattern shadcn/ui
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

export function MyButton({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "h-9 px-4 rounded-md transition-colors",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "outline" && "border border-input bg-background",
        className
      )}
      {...props}
    />
  );
}
```

### Styling

- **Tailwind** untuk inline styles
- **`cn()`** (clsx + tailwind-merge) untuk conditional classes
- **CSS variables** untuk theme colors (dari shadcn/ui)
- **Framer Motion** untuk animasi (jangan reinvent dengan CSS transition kalau butuh kompleks)

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Hello
</motion.div>
```

---

## 🌐 i18n: Aturan Wajib

Semua user-facing string **HARUS** lewat translation function. **TIDAK BOLEH** hardcoded.

```tsx
// ❌ HINDARI
<button>Buat CV</button>

// ✅ PAKAI
import { useTranslations } from "@/i18n/compat/client";
const t = useTranslations("dashboard.resumes");
<button>{t("create")}</button>
```

Setiap kali tambah key baru:
1. Edit `src/i18n/locales/id.json` (default)
2. Edit `src/i18n/locales/en.json` (paralel)
3. Pastikan struktur identik di kedua file

Detail: lihat **[I18N.md](./I18N.md)**.

---

## 💾 State Management: Zustand

Pakai store yang sudah ada (`useResumeStore`, `useAIConfigStore`, `useGrammarStore`).

### Pattern: Selector untuk avoid re-render

```tsx
// ✅ BAGUS: hanya re-render saat field tertentu berubah
const activeResume = useResumeStore((s) => s.activeResume);
const updateBasicInfo = useResumeStore((s) => s.updateBasicInfo);

// ❌ HINDARI: destructure langsung, re-render setiap state change
const { activeResume, updateBasicInfo } = useResumeStore();
```

### Pattern: Action di luar setState

```tsx
// ✅ BAGUS: side effect di luar set()
updateBasicInfo: (data) => {
  set((state) => ({
    ...state,
    activeResume: { ...state.activeResume, basic: {...state.activeResume.basic, ...data} }
  }));
  // Side effect (file sync) setelah set
  debouncedSyncToFile(get().activeResume);
}
```

---

## 🧪 Testing

**Saat ini belum ada test suite formal**. Sebelum claim selesai:

1. **TypeScript compile check**:
   ```bash
   pnpm build
   ```
   Production build pakai `tsc` di balik layar. Bila ada error TS, build akan fail.

2. **Dev server boot**:
   ```bash
   pnpm dev
   ```
   Vite akan kasih warning di console bila ada syntax error.

3. **Manual UI test**:
   - Buka `http://localhost:1713`
   - Toggle language (id ↔ en)
   - Buat CV baru
   - Edit field di workbench
   - Switch template
   - Configure AI provider
   - Test AI Polish (dengan API key valid)
   - Export PDF/JSON/Markdown

4. **Static grep checks**:
   ```bash
   # No CJK characters in src/
   grep -rEln "[一-鿿]" src/ | head -5     # harus kosong

   # No Chinese locale / timezone / provider domain
   grep -rEln "zh-CN|Asia/Shanghai|volces\.com|\.cn" src/ | head -5   # harus kosong
   ```

---

## 📝 Git Workflow

### Conventional Commits

Format: `<type>(<scope>): <description>`

Types:
- `feat:` — fitur baru
- `fix:` — bug fix
- `chore:` — maintenance (deps update, config)
- `docs:` — documentation
- `refactor:` — refactor tanpa perubahan behavior
- `perf:` — performance improvement
- `style:` — formatting, linting
- `test:` — add/update tests

Examples:
```
feat(ai): add Mistral as built-in provider
fix(editor): handle empty rich-text gracefully
chore: bump Vite to 7.4
docs: add AI provider setup guide
refactor(store): extract sync logic to separate util
```

### **PENTING**: Aturan Commit Message

**JANGAN PERNAH** sebut:
- Nama project lain mana pun
- Nama author/kontributor lain
- Atribusi atau kredit ke proyek mana pun (CV-Buff adalah karya original)

Commit message harus terlihat seperti project original yang berkembang natural.

### Branch Strategy

- `main` — production-ready, di-deploy otomatis
- `feat/nama-fitur` — untuk fitur baru
- `fix/nama-bug` — untuk bug fix
- `chore/nama-tugas` — untuk maintenance

```bash
git checkout -b feat/cover-letter
# ... ngoding ...
git add -A
git commit -m "feat(cover-letter): add cover letter generator"
git push origin feat/cover-letter
# buka PR di GitHub
```

### Push Workflow

Jika user beri token GitHub:

```bash
# Pakai inline auth (token TIDAK tersimpan di .git/config)
git push "https://x-access-token:TOKEN@github.com/nugrahalabib/CV-Buff.git" main

# Setelah push, verifikasi tidak ada token di config
grep -c "ghp_\|x-access-token" .git/config    # harus 0
```

---

## 🔌 Tips Debugging

### Vite HMR Tidak Update

```bash
# Restart server
taskkill //F //IM node.exe
pnpm dev
```

### `node_modules` Rusak (after folder rename)

```bash
rm -rf node_modules
pnpm install
```

### Build Error: Cannot find module

Biasanya import path salah atau circular dependency. Cek:
```bash
pnpm build 2>&1 | grep "Cannot find"
```

### State Tidak Persist

Cek browser DevTools → Application → LocalStorage → `cv-buff-*`. Bila tidak ada, mungkin:
- Browser di mode incognito
- Storage quota exceeded
- Key prefix berubah (cek `useResumeStore` `name: "cv-buff-resume-storage"`)

### Stream Tidak Masuk dari AI Polish

DevTools → Network → cari `polish` → response tab harus `text/event-stream`. Bila JSON dengan `error`, baca message.

---

## 📦 Adding Dependencies

**JANGAN install langsung tanpa konfirmasi**. Workflow:

1. Cek apakah dependency yang sudah ada bisa solve problem (review `package.json`)
2. Bila perlu add, diskusi dulu dengan user:
   - Nama library
   - Ukuran bundle (cek bundlephobia.com)
   - Last update + maintainer
3. Setelah disetujui:
   ```bash
   pnpm add <package>           # runtime dep
   pnpm add -D <package>        # dev dep
   ```
4. Commit `package.json` + `pnpm-lock.yaml` bersamaan

---

## 🎯 Code Quality Standards

- **TypeScript strict mode** — jangan abuse `any`. Pakai `unknown` + type guard kalau perlu.
- **No `console.log` di production code** — debug pakai `console.warn` atau hapus sebelum commit
- **Async/await** — bukan `.then()` chaining (kecuali stream / pipe)
- **Early return** untuk reduce nesting
- **Function naming**: verb-first (`createResume`, `getProvider`, `isConfigured`)
- **Component naming**: PascalCase, file = component name
- **CSS class naming**: pakai Tailwind utility-first, jangan custom CSS class kecuali terpaksa
- **Comments**: tulis "why" bukan "what". Pakai JSDoc untuk public API.

---

## 🚦 Pre-Commit Checklist

Sebelum `git commit`:

- [ ] `pnpm build` sukses (no TS errors)
- [ ] `pnpm dev` boot tanpa warning serius
- [ ] Manual UI check di browser
- [ ] Tidak ada `console.log` debug yang lupa dihapus
- [ ] Tidak ada API key / secret di code
- [ ] i18n key yang baru sudah di-add di `id.json` + `en.json`
- [ ] Commit message conventional + tidak spill info project lain

---

## 🆘 Where to Ask

- **Architectural questions** → baca [ARCHITECTURE.md](./ARCHITECTURE.md)
- **AI provider questions** → baca [AI-PROVIDERS.md](./AI-PROVIDERS.md)
- **i18n questions** → baca [I18N.md](./I18N.md)
- **Deploy questions** → baca [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Template questions** → baca [TEMPLATES.md](./TEMPLATES.md)
- **Sesi lama (history)** → baca [HISTORY.md](./HISTORY.md)
- **Master context** → baca [CLAUDE.md](../CLAUDE.md)

---

Happy coding! 🚀
