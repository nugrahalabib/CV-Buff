// One-off generator aset branding CV-Buff (icon, favicon, apple-touch, OG image).
// Render HTML bermerek via Playwright (font Plus Jakarta Sans ter-render benar),
// lalu turunkan ukurannya dengan sharp. Jalankan: node scripts/gen-brand-assets.mjs
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";
import process from "node:process";

const PUBLIC = path.resolve(process.cwd(), "public");
const FONT =
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');";

const iconHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:512px;height:512px;background:transparent}
.icon{width:512px;height:512px;display:flex;align-items:center;justify-content:center;position:relative;
  background:#0f172a;border-radius:112px;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
.icon span{color:#fff;font-weight:800;font-size:228px;letter-spacing:-14px;line-height:1}
.dot{position:absolute;top:98px;right:108px;width:34px;height:34px;border-radius:50%;background:#fff}
</style></head><body>
<div class="icon"><span>CV</span><div class="dot"></div></div>
</body></html>`;

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px}
.og{width:1200px;height:630px;position:relative;overflow:hidden;background:#0b1120;color:#fff;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;gap:30px}
.grid{position:absolute;inset:0;opacity:.55;
  background-image:linear-gradient(to right,rgba(148,163,184,.13) 1px,transparent 1px),linear-gradient(to bottom,rgba(148,163,184,.13) 1px,transparent 1px);
  background-size:48px 48px;
  -webkit-mask-image:radial-gradient(ellipse 75% 85% at 28% 45%,#000 30%,transparent 100%)}
.glow{position:absolute;width:640px;height:640px;border-radius:50%;filter:blur(130px);background:rgba(59,130,246,.28);top:-170px;right:-140px}
.glow2{position:absolute;width:520px;height:520px;border-radius:50%;filter:blur(130px);background:rgba(168,85,247,.2);bottom:-200px;right:120px}
.row{display:flex;align-items:center;gap:22px;position:relative;z-index:1}
.mark{width:84px;height:84px;border-radius:22px;background:#fff;color:#0f172a;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:42px;letter-spacing:-3px}
.brand{font-weight:800;font-size:46px;letter-spacing:-1px}
.headline{position:relative;z-index:1;font-weight:800;font-size:72px;line-height:1.05;letter-spacing:-2px;max-width:960px}
.headline em{font-style:normal;background:linear-gradient(90deg,#60a5fa,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}
.pills{position:relative;z-index:1;display:flex;gap:14px}
.pill{border:1px solid rgba(148,163,184,.32);border-radius:999px;padding:9px 20px;font-size:23px;font-weight:600;color:#e2e8f0}
</style></head><body>
<div class="og">
  <div class="grid"></div><div class="glow"></div><div class="glow2"></div>
  <div class="row"><div class="mark">CV</div><div class="brand">CV-Buff</div></div>
  <div class="headline">Tembus Filter HRD Otomatis. <em>Didukung AI &amp; Agen MCP.</em></div>
  <div class="pills"><span class="pill">100% ATS-Friendly</span><span class="pill">Powered by AgentBuff MCP</span></div>
</div>
</body></html>`;

const waitFonts = async (page) => {
  try {
    await page.evaluate(() => document.fonts.ready);
  } catch {}
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

await page.setContent(iconHtml, { waitUntil: "networkidle", timeout: 20000 });
await waitFonts(page);
const iconBuf = await page.screenshot({ clip: { x: 0, y: 0, width: 512, height: 512 }, omitBackground: true });

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(ogHtml, { waitUntil: "networkidle", timeout: 20000 });
await waitFonts(page);
const ogBuf = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });

await browser.close();

await sharp(iconBuf).png().toFile(path.join(PUBLIC, "icon.png"));
await sharp(iconBuf).resize(192, 192).png().toFile(path.join(PUBLIC, "icon-192.png"));
await sharp(iconBuf).resize(180, 180).png().toFile(path.join(PUBLIC, "apple-touch-icon.png"));
await sharp(iconBuf).resize(48, 48).png().toFile(path.join(PUBLIC, "favicon.png"));
// favicon.ico path tetap dipakai browser secara default — isi dgn PNG bytes (diterima semua browser modern)
await sharp(iconBuf).resize(32, 32).png().toFile(path.join(PUBLIC, "favicon.ico"));
await sharp(ogBuf).png().toFile(path.join(PUBLIC, "og.png"));

console.log("brand assets generated:", ["icon.png", "icon-192.png", "apple-touch-icon.png", "favicon.png", "favicon.ico", "og.png"].join(", "));
