import dns from "node:dns/promises";
import net from "node:net";

/**
 * SSRF guard (server-only). Validates that an outbound URL is http(s) and that its
 * host does NOT resolve to a private / loopback / link-local / reserved address, so
 * a user-supplied URL cannot make the server reach cloud metadata, localhost Postgres,
 * or RFC1918 internals. Re-call per redirect hop.
 *
 * Note: there is a small DNS-rebinding TOCTOU window between resolve and fetch; for the
 * threat here (authenticated users proxying avatar images) the resolve-and-check plus a
 * short timeout is a strong, standard mitigation.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0) return true; // "this" network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local (cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true; // loopback / unspecified
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local fc00::/7
    const mapped = lower.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped) return isPrivateIPv4(mapped[1]);
    return false;
  }
  return true; // unknown format -> block
}

/**
 * Throws if `rawUrl` is not a safe, public http(s) URL. Returns the parsed URL on success.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("invalid-url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("bad-scheme");
  }

  const host = url.hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (!host || BLOCKED_HOSTNAMES.has(host)) throw new Error("blocked-host");

  // Literal IP — check directly (no DNS).
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("private-ip");
    return url;
  }

  // Resolve ALL addresses; reject if any is private (defeats multi-record tricks).
  let addrs: { address: string }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("dns-failed");
  }
  if (!addrs.length) throw new Error("dns-empty");
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new Error("private-ip");
  }
  return url;
}
