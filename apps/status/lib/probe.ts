import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isBlockedIp, parsePublicUrl, UrlError } from "./ssrf.ts";

export type ProbeResult = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  error: "blocked" | "down" | null;
};

type Addr = { address: string; family: 4 | 6 };
type Response = { status: number; location: string | null };

export type ProbeDeps = {
  resolve: (hostname: string) => Promise<Addr[]>;
  request: (url: URL, addresses: Addr[]) => Promise<Response>;
};

export async function probe(raw: string, deps: ProbeDeps = realDeps): Promise<ProbeResult> {
  const started = Date.now();
  try {
    let current = parsePublicUrl(raw);
    for (let hop = 0; hop < 3; hop += 1) {
      const addresses = await deps.resolve(current.hostname);
      if (!addresses.length || addresses.some((item) => isBlockedIp(item.address))) {
        throw new UrlError("That URL is not allowed.");
      }
      const response = await deps.request(current, addresses);
      if (response.status >= 300 && response.status < 400 && response.location) {
        current = parsePublicUrl(new URL(response.location, current).href);
        continue;
      }
      const ok = response.status >= 200 && response.status < 400;
      return { ok, statusCode: response.status, latencyMs: Date.now() - started, error: ok ? null : "down" };
    }
    return { ok: false, statusCode: null, latencyMs: Date.now() - started, error: "down" };
  } catch (error) {
    return {
      ok: false,
      statusCode: null,
      latencyMs: Date.now() - started,
      error: error instanceof UrlError ? "blocked" : "down",
    };
  }
}

export async function resolvePublic(hostname: string): Promise<Addr[]> {
  const host = hostname.replace(/^\[|\]$/g, "");
  const literal = host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host);
  if (literal) {
    if (isBlockedIp(host)) throw new UrlError("That URL is not allowed.");
    return [{ address: host, family: host.includes(":") ? 6 : 4 }];
  }
  const records = await Promise.race([
    lookup(host, { all: true, verbatim: true }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), 2000);
    }),
  ]);
  if (!records.length || records.some((record) => isBlockedIp(record.address))) {
    throw new UrlError("That URL is not allowed.");
  }
  return records.map((record) => ({ address: record.address, family: record.family === 6 ? 6 : 4 }));
}

const realDeps: ProbeDeps = { resolve: resolvePublic, request: requestOnce };

function requestOnce(url: URL, addresses: Addr[]): Promise<Response> {
  const lib = url.protocol === "https:" ? https : http;
  const pinned = addresses[0];
  if (!pinned) return Promise.reject(new Error("down"));
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        method: "GET",
        protocol: url.protocol,
        hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}` || "/",
        headers: { host: url.host, accept: "*/*", "user-agent": "status", connection: "close" },
        servername: hostname,
        timeout: 4000,
        rejectUnauthorized: true,
        lookup: (_hostname, options, callback) => {
          const cb = typeof options === "function" ? options : callback;
          if (typeof cb !== "function") return;
          if (typeof options === "object" && options && "all" in options && options.all) {
            cb(null, addresses.map((item) => ({ address: item.address, family: item.family })));
            return;
          }
          cb(null, pinned.address, pinned.family);
        },
      },
      (res) => {
        const location = typeof res.headers.location === "string" ? res.headers.location : null;
        res.destroy();
        resolve({ status: res.statusCode ?? 0, location });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", () => reject(new Error("down")));
    req.end();
  });
}
