import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("100.64.0.0", 10, "ipv4");
blocked.addSubnet("127.0.0.0", 8, "ipv4");
blocked.addSubnet("169.254.0.0", 16, "ipv4");
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.0.0.0", 24, "ipv4");
blocked.addSubnet("192.0.2.0", 24, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("198.18.0.0", 15, "ipv4");
blocked.addSubnet("198.51.100.0", 24, "ipv4");
blocked.addSubnet("203.0.113.0", 24, "ipv4");
blocked.addSubnet("224.0.0.0", 4, "ipv4");
blocked.addSubnet("240.0.0.0", 4, "ipv4");
blocked.addAddress("255.255.255.255", "ipv4");
blocked.addAddress("::", "ipv6");
blocked.addAddress("::1", "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2001::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");

const NAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal", "metadata.google"]);
const SUFFIXES = [".local", ".localhost", ".internal", ".localdomain", ".intranet", ".lan", ".home.arpa", ".arpa"];

export class UrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlError";
  }
}

export function isBlockedIp(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, "").split("%")[0].toLowerCase();
  if (bare.startsWith("64:ff9b:")) {
    const v4 = nat64(bare);
    return v4 ? isBlockedIp(v4) : true;
  }
  const family = isIP(bare);
  if (family === 0) return true;
  return blocked.check(bare, family === 4 ? "ipv4" : "ipv6");
}

export function parsePublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UrlError("Enter an http or https URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new UrlError("Enter an http or https URL.");
  if (url.username || url.password) throw new UrlError("That URL is not allowed.");
  const standard = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== standard) throw new UrlError("That URL is not allowed.");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host.includes("%") || NAMES.has(host) || SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new UrlError("That URL is not allowed.");
  }
  if (/^\d+$/.test(host) || (isIP(host) && isBlockedIp(host))) throw new UrlError("That URL is not allowed.");
  url.hash = "";
  return url;
}

function nat64(ip: string): string | null {
  const dotted = ip.match(/^64:ff9b::(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) return dotted[1];
  const hex = ip.match(/^64:ff9b::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex) return null;
  const hi = Number.parseInt(hex[1], 16);
  const lo = Number.parseInt(hex[2], 16);
  return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
}
