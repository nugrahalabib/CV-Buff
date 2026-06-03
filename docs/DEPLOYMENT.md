# DEPLOYMENT.md — Panduan Deployment

> Cara deploy CV-Buff ke production di berbagai platform. Semua skenario menjaga port **1713** sebagai default.

---

## ☁️ Pilihan Deployment

| Platform | Cocok untuk | Complexity | Cost |
|---|---|---|---|
| **Docker (VPS)** | Full control, custom domain | Medium | $5+/bulan VPS |
| **Cloudflare Workers** | Global edge, autoscale | Medium | Free tier generous |
| **Vercel** | Quick deploy, preview branches | Low | Free tier OK untuk personal |
| **Netlify** | Quick deploy alternative | Low | Free tier OK |
| **Railway / Render** | Managed PaaS | Low | $5+/bulan |
| **Self-host (bare metal)** | Maximum control | High | Hardware sendiri |

---

## 🐳 Docker (Recommended untuk VPS)

### Quick Start

```bash
docker compose up -d
```

Container expose port **1713**. Akses via `http://<server-ip>:1713`.

### Step by Step

1. **SSH ke VPS** (Ubuntu/Debian recommended):
   ```bash
   ssh user@your-vps-ip
   ```

2. **Install Docker** (sekali saja):
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **Clone repo**:
   ```bash
   git clone https://github.com/nugrahalabib/CV-Buff.git
   cd CV-Buff
   ```

4. **Build & run**:
   ```bash
   docker compose up -d --build
   ```

5. **Setup Nginx reverse proxy** (untuk HTTPS + custom domain):

   `/etc/nginx/sites-available/cv-buff`:
   ```nginx
   server {
       listen 80;
       server_name cv.agentbuff.id;

       location / {
           proxy_pass http://localhost:1713;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 60s;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/cv-buff /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. **HTTPS dengan Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d cv.agentbuff.id
   ```

7. **Auto-restart on reboot**:
   Docker compose dengan `restart: always` di `docker-compose.yml` sudah handle ini.

### Update Production

```bash
cd CV-Buff
git pull origin main
docker compose up -d --build
```

### Monitor Logs

```bash
docker compose logs -f web
```

---

## 🌐 Cloudflare Workers

### Prerequisites

- Akun Cloudflare (free tier OK)
- Domain di Cloudflare DNS (atau pakai `*.workers.dev` subdomain)
- Install `wrangler` (sudah ada di devDependencies)

### Setup

1. **Login Cloudflare**:
   ```bash
   pnpm wrangler login
   ```

2. **Setup `wrangler.toml`** (sudah ada di repo):
   ```toml
   name = "cv-buff"
   main = "dist/server/server.js"
   compatibility_date = "2025-12-01"
   compatibility_flags = ["nodejs_compat"]

   [assets]
   directory = "dist/client"
   ```

3. **Build**:
   ```bash
   pnpm build
   ```

4. **Deploy**:
   ```bash
   pnpm wrangler deploy
   ```

   Output:
   ```
   Published cv-buff (https://cv-buff.your-account.workers.dev)
   ```

5. **Custom domain**:
   - Buka Cloudflare Dashboard → Workers & Pages → cv-buff → Settings → Triggers
   - Add Custom Domain: `cv.agentbuff.id`
   - Cloudflare auto-setup DNS record + SSL

### GitHub Actions Auto-Deploy

File `.github/workflows/deploy.yml` sudah ada:

```yaml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

Setup secrets di GitHub repo settings → Secrets:
- `CLOUDFLARE_API_TOKEN` — generate di Cloudflare Dashboard → My Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID` — di Cloudflare Dashboard sidebar

Setiap push ke `main` → auto-deploy.

---

## ▲ Vercel

### Quick Deploy

1. Login ke https://vercel.com dengan GitHub
2. Klik "Add New Project" → pilih repo `nugrahalabib/CV-Buff`
3. Framework Preset: **Other** (Vercel akan auto-detect Vite)
4. Build settings:
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist/client`
   - **Install Command**: `pnpm install`
5. **Environment Variables** (opsional, untuk PDF export server):
   - `PDF_SERVER_URL` = `https://api.cv.agentbuff.id/generate-pdf`
6. Deploy

### Custom Domain

Vercel Dashboard → Project → Settings → Domains → Add `cv.agentbuff.id`.

### Catatan untuk Vercel

- TanStack Start di Vercel butuh Node runtime (bukan Edge). Pastikan setting "Functions" pakai Node 20.
- API routes (`/api/polish` dll.) berjalan sebagai Serverless Functions.
- File `server.mjs` **tidak dipakai** di Vercel — Vercel adapter handle entry point.

---

## 🚂 Railway / Render

### Railway

1. Login ke https://railway.app
2. New Project → Deploy from GitHub repo
3. Build settings:
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm build`
   - **Start Command**: `node server.mjs`
   - **PORT**: 1713 (atau set via env var `PORT`)
4. Generate Domain → siap

### Render

1. Login ke https://render.com
2. New Web Service → connect repo
3. **Environment**: Node 20
4. **Build Command**: `pnpm install --frozen-lockfile && pnpm build`
5. **Start Command**: `node server.mjs`
6. **Port**: 1713

---

## 🖥️ Self-Host (Bare Metal / VPS Tanpa Docker)

```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm i -g pnpm@10

# Clone
git clone https://github.com/nugrahalabib/CV-Buff.git
cd CV-Buff

# Install + build
pnpm install
pnpm build

# Setup systemd service
sudo nano /etc/systemd/system/cv-buff.service
```

```ini
[Unit]
Description=CV-Buff
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/CV-Buff
Environment=PORT=1713
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable cv-buff
sudo systemctl start cv-buff
sudo systemctl status cv-buff
```

Setup Nginx + Let's Encrypt sama dengan section Docker di atas.

---

## 🔐 Environment Variables

CV-Buff biasanya tidak butuh env vars — semua config statis di kode. Yang opsional:

| Env Var | Deskripsi | Default |
|---|---|---|
| `PORT` | Port server (production) | `1713` |
| `HOSTNAME` | Hostname binding | `0.0.0.0` |
| `NODE_ENV` | Environment | `production` |
| `HTTPS_PROXY` / `HTTP_PROXY` | Proxy untuk Gemini SDK (corporate network) | (none) |
| `FONTCONFIG_PATH` | Path font config (Lambda) | `/var/task/fonts` |

---

## 🌍 Domain Setup

Project ini di-design untuk domain `cv.agentbuff.id`. Beberapa file hardcoded ini:

- `src/routes/$locale.tsx` — `SEO_BASE_URL`
- `src/app/sitemap.ts` — `baseUrl`
- `src/app/(public)/[locale]/layout.tsx` — `baseUrl`
- `src/app/layout.tsx` — `metadataBase`
- `public/robots.txt` — sitemap URL
- `public/sitemap.xml` — semua URL
- `src/config/constants.ts` — `PDF_EXPORT_CONFIG.SERVER_URL`

**Bila pakai domain lain**, search & replace `cv.agentbuff.id` di seluruh file di atas dengan domain Anda.

---

## 🖨️ PDF Export Server (Optional)

CV-Buff frontend mengandalkan endpoint `https://api.cv.agentbuff.id/generate-pdf` untuk PDF presisi tinggi. Bila Anda perlu host endpoint ini sendiri:

### Microservice PDF dengan Puppeteer

```js
// pdf-server.mjs
import express from "express";
import puppeteer from "puppeteer";

const app = express();
app.use(express.json({ limit: "5mb" }));

app.post("/generate-pdf", async (req, res) => {
  const { html, css, fonts } = req.body;

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>${fonts}\n${css}</style>
    </head>
    <body>${html}</body>
    </html>
  `, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  res.set("Content-Type", "application/pdf");
  res.send(pdf);
});

app.listen(8080, () => console.log("PDF server on :8080"));
```

Deploy ke VPS / Cloud Run / Lambda. Update `PDF_EXPORT_CONFIG.SERVER_URL` ke endpoint baru.

**Alternatif**: User bisa pakai browser print (Ctrl+P → Save as PDF) — tidak butuh server. Itu sudah built-in di CV-Buff via `pnpm` button "Cetak Browser".

---

## 🔍 Health Check & Monitoring

### Health Check Endpoint

CV-Buff belum punya health check endpoint built-in. Bila perlu, tambah file `src/routes/api/health.ts`:

```ts
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => Response.json({ status: "ok", timestamp: Date.now() }),
    },
  },
});
```

Lalu setup uptime monitoring (UptimeRobot, BetterStack, dll.) ke `https://cv.agentbuff.id/api/health`.

### Logs

- **Docker**: `docker compose logs -f web`
- **systemd**: `journalctl -u cv-buff -f`
- **Cloudflare**: Dashboard → Workers → Logs (real-time)
- **Vercel**: Dashboard → Project → Logs

### Error Tracking

CV-Buff tidak otomatis kirim error ke Sentry / Datadog dll. Bila perlu, tambah `@sentry/react` + setup di `src/routes/__root.tsx`.

**PENTING**: Pastikan setup Sentry **tidak include PII** (data CV user) — privacy first.

---

## 🚀 Performance Tuning

### CDN untuk Static Assets

Cloudflare Workers + Pages otomatis serve static asset dari edge. Untuk VPS, gunakan Cloudflare di depan (proxy mode orange cloud).

### Compression

`server.mjs` belum compress response. Untuk produksi, tambah `compression` middleware atau biarkan reverse proxy (Nginx/Cloudflare) handle gzip/brotli.

### Bundle Size

Lihat warning di `pnpm build` — chunk besar:
- `pdf` (~459 KB gzip 139KB) — pdfjs-dist (lazy loaded, OK)
- `main` (~1.1 MB gzip 305 KB) — bisa di-split lebih granular

Untuk optimization, manual chunks di `vite.config.ts`:

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        "tiptap": ["@tiptap/core", "@tiptap/react", "@tiptap/starter-kit"],
        "radix": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
      }
    }
  }
}
```

---

## 🧯 Troubleshooting

### Build gagal: TypeScript errors

```bash
pnpm build 2>&1 | tail -30
```

Cek error messages. Biasanya:
- Type mismatch karena update dependency
- Missing import
- Circular dependency warnings (acceptable, tidak fatal)

### Container exit immediately

Cek Dockerfile:
- `EXPOSE 1713` ada?
- `ENV PORT=1713` ada?
- Server.mjs binding ke `0.0.0.0` (bukan `localhost`)? — Cek `host` di `server.mjs`

### Port 1713 sudah dipakai di host

```bash
# Cek proses
sudo lsof -i :1713

# Atau ubah port di docker-compose.yml
ports:
  - "8080:1713"    # host 8080 → container 1713
```

### AI Polish 500 di production

Server tidak bisa reach provider endpoint. Cek:
- Cloudflare Workers: `compatibility_flags = ["nodejs_compat"]` ada? (untuk fetch + streaming)
- VPS: firewall rules outbound HTTPS? `sudo ufw status`
- Corporate network: butuh `HTTPS_PROXY` env var

---

## 📊 Cost Estimate (Bulanan)

| Setup | Cost (USD) |
|---|---|
| Cloudflare Workers (free tier) | $0 |
| Vercel Hobby | $0 |
| Railway starter | $5 |
| Render starter | $7 |
| VPS Digital Ocean droplet (1 vCPU, 1 GB) | $6 |
| VPS Hetzner CX11 | $4 |
| Custom domain (.id) | ~$25/tahun (~$2/bulan) |
| Cloudflare DNS + SSL | $0 |

**Total minimum**: $0 (Cloudflare Workers + free domain `.workers.dev`) sampai ~$10/bulan (VPS + .id domain).

---

## ✅ Post-Deploy Checklist

- [ ] Akses `https://cv.agentbuff.id` (atau domain Anda) → 200 OK
- [ ] HTTPS aktif + cert valid
- [ ] Page title: "CV-Buff - Editor CV Berbasis AI"
- [ ] Default locale `id` aktif (redirect dari `/`)
- [ ] Switch language → `/en` works
- [ ] Dashboard reachable (`/app/dashboard`)
- [ ] AI provider config UI render benar
- [ ] Test bikin CV baru → editor → preview → export PDF
- [ ] Browser console: no error
- [ ] Lighthouse score >85
- [ ] Sitemap aksesible (`/sitemap.xml`)
- [ ] robots.txt aksesible (`/robots.txt`)
- [ ] PWA manifest aksesible (`/manifest.webmanifest`)
- [ ] OG image preview (test di [opengraph.dev](https://www.opengraph.dev/))

---

Selamat deploy! 🚀
