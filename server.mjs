import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, normalize, resolve } from "node:path";
import { Readable } from "node:stream";
import serverEntry from "./dist/server/server.js";

const clientDir = resolve(process.cwd(), "dist/client");
const port = Number(process.env.PORT || 1713);
const host = process.env.HOSTNAME || "0.0.0.0";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8"
};

function getContentType(filePath) {
  const extension = extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
}

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // TanStack Start injects inline hydration scripts; Tailwind/templates use inline styles.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self'"
].join("; ");

// Company-grade response hardening applied to every response (static + dynamic).
function setSecurityHeaders(req, res, protocol) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );
  res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  const forwardedProto = (req.headers["x-forwarded-proto"] || "").toString();
  if (protocol === "https" || forwardedProto.includes("https")) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains"
    );
  }
}

function toHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(nodeHeaders)) {
    if (typeof value === "undefined") continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

function resolveStaticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^[/\\]+/, "");
  const absolutePath = resolve(clientDir, normalized);
  if (!absolutePath.startsWith(clientDir)) return null;
  if (!existsSync(absolutePath)) return null;
  const stats = statSync(absolutePath);
  if (!stats.isFile()) return null;
  return absolutePath;
}

function tryServeStatic(req, res, url) {
  if (!url.pathname || url.pathname.endsWith("/")) return false;
  const filePath = resolveStaticFile(url.pathname);
  if (!filePath) return false;

  res.statusCode = 200;
  res.setHeader("Content-Type", getContentType(filePath));
  if (url.pathname.startsWith("/assets/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    res.setHeader("Cache-Control", "public, max-age=3600");
  }

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}

function appendSetCookie(res, value) {
  const existing = res.getHeader("set-cookie");
  if (!existing) {
    res.setHeader("set-cookie", value);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader("set-cookie", [...existing, value]);
    return;
  }
  res.setHeader("set-cookie", [String(existing), value]);
}

createServer(async (req, res) => {
  try {
    const hostHeader = req.headers.host || `localhost:${port}`;
    const protocol = (req.headers["x-forwarded-proto"] || "http").toString().split(",")[0].trim();
    const url = new URL(req.url || "/", `${protocol}://${hostHeader}`);

    setSecurityHeaders(req, res, protocol);

    if (tryServeStatic(req, res, url)) return;

    const method = (req.method || "GET").toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const init = {
      method,
      headers: toHeaders(req.headers)
    };

    if (hasBody) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }

    const request = new Request(url, init);
    const response = await serverEntry.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        appendSetCookie(res, value);
      } else {
        res.setHeader(key, value);
      }
    });

    if (method === "HEAD" || !response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
}).listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
