// Generate ALL CV-Buff brand assets from the provided winged-V logo.
// Icons = dark rounded square + white emblem (self-contained, works on any bg).
// Run: node scripts/gen-logo-assets.mjs
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";
import { readFileSync } from "node:fs";

const SRC =
  "C:\\Users\\nugra\\Documents\\Project\\Agentbuff-App\\LOGO APP\\Logo - CV AgentBuff.png";
const PUBLIC = path.resolve(process.cwd(), "public");
const BG = "#0f172a";

// 1) Trim transparent padding -> tight emblem (dark, transparent).
const trimmedDark = await sharp(SRC).trim().png().toBuffer();

// Raw transparent logo (dark) kept for any future inline use.
await sharp(trimmedDark).resize({ width: 800 }).png().toFile(path.join(PUBLIC, "logo.png"));

// 2) White emblem (invert RGB, keep alpha) for placing on the dark icon bg.
const trimmedWhite = await sharp(trimmedDark)
  .negate({ alpha: false })
  .linear(1.12, 0) // nudge toward pure white
  .png()
  .toBuffer();

// 3) Square app icon: dark rounded square + white emblem centered.
const SIZE = 512;
const RADIUS = 112;
const INNER_W = 460; // emblem width inside the 512 square (wings near the edges)
const embForIcon = await sharp(trimmedWhite)
  .resize({ width: INNER_W, fit: "inside" })
  .png()
  .toBuffer();
const roundedBg = await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" fill="${BG}"/></svg>`
  )
)
  .png()
  .toBuffer();
const icon512 = await sharp(roundedBg)
  .composite([{ input: embForIcon, gravity: "center" }])
  .png()
  .toBuffer();

await sharp(icon512).toFile(path.join(PUBLIC, "icon.png"));
await sharp(icon512).resize(192, 192).toFile(path.join(PUBLIC, "icon-192.png"));
await sharp(icon512).resize(180, 180).toFile(path.join(PUBLIC, "apple-touch-icon.png"));
await sharp(icon512).resize(48, 48).toFile(path.join(PUBLIC, "favicon.png"));
// favicon.ico path is requested by browsers by default — fill with 32px PNG bytes (accepted).
await sharp(icon512).resize(32, 32).toFile(path.join(PUBLIC, "favicon.ico"));

// 4) OG image (1200x630) via Playwright — white emblem + wordmark + tagline on dark grid.
const FONT =
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');";
const logoB64 = readFileSync(SRC).toString("base64");
const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
.og{width:1200px;height:630px;position:relative;overflow:hidden;background:#0b1120;color:#fff;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px}
.grid{position:absolute;inset:0;opacity:.5;
  background-image:linear-gradient(to right,rgba(148,163,184,.12) 1px,transparent 1px),linear-gradient(to bottom,rgba(148,163,184,.12) 1px,transparent 1px);
  background-size:48px 48px;-webkit-mask-image:radial-gradient(ellipse 70% 75% at 50% 45%,#000 30%,transparent 100%)}
.glow{position:absolute;width:640px;height:640px;border-radius:50%;filter:blur(130px);background:rgba(59,130,246,.25);top:-160px}
.emblem{position:relative;z-index:1;width:360px;filter:brightness(0) invert(1) drop-shadow(0 8px 40px rgba(59,130,246,.35))}
.brand{position:relative;z-index:1;font-weight:800;font-size:58px;letter-spacing:-1px}
.tagline{position:relative;z-index:1;font-weight:600;font-size:26px;color:#cbd5e1}
.pill{position:relative;z-index:1;border:1px solid rgba(148,163,184,.3);border-radius:999px;padding:9px 22px;font-size:22px;font-weight:600;color:#e2e8f0}
</style></head><body>
<div class="og">
  <div class="grid"></div><div class="glow"></div>
  <img class="emblem" src="data:image/png;base64,${logoB64}" />
  <div class="brand">CV-Buff</div>
  <div class="pill">100% ATS-Friendly · Tembus Filter HRD Otomatis</div>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(ogHtml, { waitUntil: "networkidle", timeout: 20000 });
try { await page.evaluate(() => document.fonts.ready); } catch {}
const ogBuf = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
await sharp(ogBuf).png().toFile(path.join(PUBLIC, "og.png"));

console.log("logo assets generated:", ["logo.png", "icon.png", "icon-192.png", "apple-touch-icon.png", "favicon.png", "favicon.ico", "og.png"].join(", "));
