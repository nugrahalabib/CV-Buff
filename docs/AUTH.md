# AUTH.md — Login Google & Sistem Autentikasi CV-Buff

> Panduan lengkap mengaktifkan **login wajib via Google** di CV-Buff: cara mendapatkan Google Client ID + Secret, mengatur env, migrasi database, menjalankan, dan menambah SSO lain di kemudian hari.

---

## 🎯 Ringkasan

Mulai versi ini, **seluruh area aplikasi (`/app/*`) wajib login Google**. Pengunjung baru harus masuk dengan akun Google sebelum bisa membuat CV. Saat pertama login, profil Google mereka (**nama, email, foto, status verifikasi**) otomatis tersimpan sebagai akun terdaftar.

**Model data & privasi:**
- **Isi CV disimpan di server** (tabel `resume` di PostgreSQL yang sama dengan auth), **terisolasi penuh per pengguna** (setiap query di-scope ke `user.id`). CV hanya sampai ke perangkat saat **download/export**.
- Yang **TIDAK pernah** ke server: **kunci API AI milik pengguna** — tetap di browser saja (LocalStorage `cv-buff-ai-config`), tidak pernah kami simpan.
- Tiap user terisolasi penuh: **tidak ada endpoint yang melisting user**, dan tidak ada user yang bisa membaca/menimpa/menghapus CV milik user lain.

**Stack:** [better-auth](https://better-auth.com) + **PostgreSQL** (driver `pg`, self-hosted di VPS). Provider login bersifat **registry/colokan** — menambah GitHub/Microsoft/OIDC/SSO nanti cukup edit satu file.

| Halaman publik (tetap bebas) | Area terkunci (wajib login) |
|---|---|
| `/`, `/id`, `/en` (landing), `/login` | `/app/*` (dashboard, editor, dll.) |

---

## 🗂️ File yang terlibat

| File | Peran |
|---|---|
| `src/lib/server/auth.ts` | Instance better-auth (server-only). Konfigurasi DB, sesi, cookie, plugin. |
| `src/lib/server/authProviders.ts` | **Registry provider ("colokan SSO")** — tempat menambah provider login. |
| `src/lib/server/requireUser.ts` | Penjaga server-side: dipanggil di tiap API sensitif (401/403). |
| `src/routes/api/auth/$.ts` | Catch-all `/api/auth/*` → handler better-auth. |
| `src/lib/auth-client.ts` | Client browser (`useSession`, `signIn`, `signOut`). |
| `src/routes/login.tsx` | Halaman `/login` (tombol "Lanjutkan dengan Google"). |
| `src/routes/app/route.tsx` | **Guard tunggal** semua `/app/*` (redirect ke `/login` bila belum masuk). |
| `src/components/auth/UserMenu.tsx` | Avatar + nama + tombol Keluar (di sidebar dashboard & header editor). |
| `src/lib/server/db.ts` | Koneksi pool Postgres (`pg`) bersama auth + CV; bikin tabel `resume` idempoten. Tabel di DB `cvbuff`: `user`, `session`, `account`, `verification`, `resume`. |

---

## 🔑 Langkah 1 — Dapatkan Google OAuth Client ID & Secret

> Butuh akun Google biasa. Gratis, tidak perlu kartu kredit.

### 1.1 Buat / pilih project
1. Buka **https://console.cloud.google.com/**.
2. Di bar atas, klik dropdown project → **New Project**.
3. Nama project mis. `CV-Buff` → **Create**. Tunggu beberapa detik, lalu pilih project itu.

### 1.2 Atur OAuth consent screen
1. Menu kiri → **APIs & Services → OAuth consent screen** (atau **Google Auth Platform → Branding**).
2. **User Type: External** → **Create**.
3. Isi:
   - **App name:** `CV-Buff`
   - **User support email:** email kamu
   - **Developer contact information:** email kamu
4. **Scopes:** klik **Add or Remove Scopes** → centang **hanya** tiga ini:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   
   (Ketiga scope ini **tidak** memicu proses verifikasi Google yang berat.) → **Update** → **Save and Continue**.
5. **Test users:** selama app masih status **Testing**, hanya email yang kamu daftarkan di sini yang bisa login. Tambahkan email kamu (dan email tester lain). → **Save**.

> **Publish ke Production:** saat siap dipakai publik, di OAuth consent screen klik **Publish App**. Untuk scope dasar di atas (`email`/`profile`/`openid`), Google **tidak** mewajibkan verifikasi/review, jadi app langsung bisa dipakai siapa saja.

### 1.3 Buat OAuth Client ID
1. Menu kiri → **APIs & Services → Credentials**.
2. **+ Create Credentials → OAuth client ID**.
3. **Application type: Web application**.
4. **Name:** `CV-Buff Web`.
5. **Authorized JavaScript origins** — tambahkan:
   - `http://localhost:1713`  (development)
   - `https://cv.agentbuff.id`  (production — sesuaikan dengan domainmu)
6. **Authorized redirect URIs** — tambahkan **persis** (path callback better-auth):
   - `http://localhost:1713/api/auth/callback/google`
   - `https://cv.agentbuff.id/api/auth/callback/google`
7. **Create**. Muncul popup berisi:
   - **Client ID** (mis. `1234-abcd.apps.googleusercontent.com`)
   - **Client secret** (mis. `GOCSPX-xxxxxxxx`)
   
   Salin keduanya.

> ⚠️ Redirect URI harus **sama persis** (termasuk `http`/`https`, tanpa trailing slash) dengan yang dipakai app, atau muncul error `redirect_uri_mismatch`.

---

## ⚙️ Langkah 2 — Atur Environment

Salin `.env.example` menjadi `.env` lalu isi:

```dotenv
# Secret untuk menandatangani cookie sesi — generate sekali:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
BETTER_AUTH_SECRET=hasil-generate-di-atas

# URL publik app (dev vs prod)
BETTER_AUTH_URL=http://localhost:1713

# Koneksi PostgreSQL (auth + CV per-user). Dev via SSH tunnel ke Postgres VPS:
#   ssh -L 55432:localhost:5432 agentbuff-vps   →   ...@localhost:55432/cvbuff
DATABASE_URL=postgresql://cvbuff_user:PASS@localhost:5432/cvbuff

# Dari Google Cloud Console (Langkah 1.3)
GOOGLE_CLIENT_ID=1234-abcd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```

> `.env` sudah masuk `.gitignore` — **jangan commit**. Untuk production, set `BETTER_AUTH_URL=https://cv.agentbuff.id` dan **secret yang berbeda & rahasia**.

---

## 🗄️ Langkah 3 — Migrasi Database

Buat tabel auth (`user`, `session`, `account`, `verification`) di PostgreSQL `cvbuff`. Pastikan `DATABASE_URL` ter-set (untuk dev, buka SSH tunnel dulu: `ssh -L 55432:localhost:5432 agentbuff-vps`):

```bash
pnpm db:migrate
```

(Script ini menjalankan `pnpm dlx @better-auth/cli@latest migrate --config src/lib/server/auth.ts -y`. Idempotent — aman dijalankan ulang; hanya menambah yang belum ada.)

---

## ▶️ Langkah 4 — Jalankan

**Development:**
```bash
pnpm dev          # http://localhost:1713
```
- Buka `/app/dashboard` tanpa login → otomatis dialihkan ke `/login`.
- Klik **Lanjutkan dengan Google** → pilih akun → kembali ke `/app/dashboard/resumes`.
- Avatar + nama muncul di sidebar dashboard dan header editor. **Keluar** menghapus sesi + data CV lokal.

**Production (Docker):**
```bash
docker compose up -d --build
docker compose exec web pnpm db:migrate   # sekali saja, setelah deploy pertama
```
`docker-compose.yml` sudah memuat `.env` (`env_file`) dan menyimpan DB di volume `cvbuff-data` (persisten antar-restart).

---

## 🔌 Langkah 5 — Menambah SSO/Provider Lain (Colokan)

Semua provider diatur di **`src/lib/server/authProviders.ts`**. Tidak perlu migrasi DB — tiap provider jadi baris `account` baru dengan `providerId` berbeda.

### Provider OAuth bawaan (GitHub, Microsoft, Apple, dll.)
1. Tambah entri di `socialProviders`:
   ```ts
   github: {
     clientId: process.env.GITHUB_CLIENT_ID as string,
     clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
   },
   ```
2. Tambah `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` di `.env`, dan daftarkan redirect URI `<BASE_URL>/api/auth/callback/github` di console GitHub.
3. Tambah tombol di `src/routes/login.tsx`:
   ```tsx
   signIn.social({ provider: "github", callbackURL: "/app/dashboard/resumes" });
   ```

### Provider OIDC korporat (Okta, Azure AD, Keycloak, dll.)
Sudah disediakan slot `genericOAuth({ config: [] })` di `src/lib/server/auth.ts`. Isi `config` dengan provider OIDC-mu (callback: `/api/auth/oauth2/callback/<providerId>`), lalu login via `signIn.oauth2({ providerId })`. Tambah `genericOAuthClient()` ke `src/lib/auth-client.ts`.

### SSO penuh (SAML / OIDC multi-tenant)
```bash
pnpm add @better-auth/sso
```
Daftarkan plugin `sso()` di server & `ssoClient()` di client, lalu daftarkan Identity Provider lewat API better-auth. Detail: https://better-auth.com/docs/plugins/sso

---

## 🔒 Catatan Keamanan & Isolasi Data

- Cookie sesi: `HttpOnly` + signed; `Secure` aktif otomatis di production (`NODE_ENV=production`), **nonaktif di `http://localhost`** agar login dev tidak gagal.
- `userId` **selalu** diambil dari cookie sesi sisi server (`auth.api.getSession`), tidak pernah dari body/query request.
- `requireUser()` melindungi `/api/polish`, `/api/grammar`, `/api/resume-import` — request tanpa sesi → **401**, origin asing → **403**.
- Guard `/app/route.tsx` bersifat UX (client). **Batas keamanan sebenarnya** ada di server (`requireUser`) + fakta bahwa isi CV hanya ada di browser masing-masing.
- `trustedOrigins` dibatasi ke `localhost:1713` + `cv.agentbuff.id`.
- **Browser bersama:** tombol **Keluar** menghapus `cv-buff-resume-storage` + `cv-buff-ai-config` lalu hard-reload, agar CV satu user tidak terlihat oleh akun berikutnya di perangkat yang sama.

---

## 🆘 Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| `Error 400: redirect_uri_mismatch` | Redirect URI di Google Console tidak sama persis. Pastikan `…/api/auth/callback/google`, cocokkan `http`/`https`, tanpa trailing slash. |
| Login hanya bisa dengan email tertentu | Consent screen masih **Testing** → tambah email ke **Test users**, atau **Publish App**. |
| Login dev gagal/loop, cookie tak tersimpan | Jangan paksa `Secure` cookie di `http://localhost`. Pastikan `NODE_ENV` bukan `production` saat dev. |
| `401 Unauthorized` di fitur AI walau sudah login | Sesi belum terbentuk / cookie tidak terkirim. Cek `BETTER_AUTH_URL` cocok dengan origin yang dipakai. |
| Tombol Google diam saja | `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` belum diisi di `.env` (provider Google otomatis nonaktif sampai diisi). |
| `no such table: user` | Belum migrasi. Jalankan `pnpm db:migrate`. |
| Secret bocor / mau ganti | Ganti `BETTER_AUTH_SECRET` (semua sesi lama otomatis invalid). |

---

## 📦 Dampak Deployment

Auth + CV pakai **PostgreSQL self-hosted di VPS** (DB `cvbuff` di `postgres_container`), terhubung via `DATABASE_URL`. Driver `pg` pure-JS (tak butuh build native). Target deploy = **Node/Docker/VPS**. Untuk **dev lokal**, buka SSH tunnel ke Postgres VPS lalu pakai port lokal: `ssh -L 55432:localhost:5432 agentbuff-vps` + `DATABASE_URL=postgresql://cvbuff_user:PASS@localhost:55432/cvbuff`. Untuk **Docker di VPS**, pakai `host.docker.internal:5432` (compose sudah set `extra_hosts`).
