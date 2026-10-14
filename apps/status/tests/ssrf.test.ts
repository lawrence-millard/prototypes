import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { reduceMonitors, statusLine } from "../lib/list-state.ts";
import { probe } from "../lib/probe.ts";
import { isBlockedIp, parsePublicUrl, UrlError } from "../lib/ssrf.ts";

test("blocks private, local, and obfuscated targets", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.1.1", "172.16.0.1", "169.254.169.254", "0.0.0.0", "::1", "fc00::1", "fe80::1", "255.255.255.255", "::ffff:127.0.0.1", "64:ff9b::127.0.0.1"]) {
    assert.equal(isBlockedIp(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "100.63.0.1", "2001:4860:4860::8888"]) {
    assert.equal(isBlockedIp(ip), false, ip);
  }
  for (const raw of ["http://127.0.0.1", "http://0x7f000001", "http://2130706433", "http://[::1]", "http://localhost", "http://metadata.google.internal", "http://example.com:22", "https://user:pass@example.com", "file:///etc/passwd"]) {
    assert.throws(() => parsePublicUrl(raw), UrlError, raw);
  }
  assert.equal(parsePublicUrl("https://example.com/a#x").href, "https://example.com/a");
});

test("does not connect to loopback or to a redirected private address", async () => {
  let hits = 0;
  const server = http.createServer((_req, res) => {
    hits += 1;
    res.end("ok");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const result = await probe("http://127.0.0.1/");
  assert.equal(result.error, "blocked");
  assert.equal(hits, 0);
  server.close();

  const calls: string[] = [];
  const redirected = await probe("https://example.com/health", {
    resolve: async () => [{ address: "1.1.1.1", family: 4 }],
    request: async (url) => {
      calls.push(url.href);
      return { status: 302, location: "http://127.0.0.1/" };
    },
  });
  assert.equal(redirected.error, "blocked");
  assert.deepEqual(calls, ["https://example.com/health"]);

  let requested = false;
  const rebound = await probe("https://example.com/", {
    resolve: async () => [{ address: "10.0.0.8", family: 4 }],
    request: async () => {
      requested = true;
      return { status: 200, location: null };
    },
  });
  assert.equal(rebound.error, "blocked");
  assert.equal(requested, false);
});

test("status line and list edits", () => {
  const item = { id: "1", url: "https://example.com", label: "Example", ok: true, statusCode: 200, latencyMs: 12, error: null };
  assert.equal(statusLine(item, false), "200 · 12ms");
  assert.equal(statusLine(item, true), "Checking");
  assert.equal(statusLine({ ...item, ok: false, error: "down", statusCode: 500 }, false), "Down");
  assert.equal(statusLine({ ...item, ok: false, error: "blocked", statusCode: null }, false), "Blocked");
  const removed = reduceMonitors([item], { type: "delete", id: "1" });
  assert.equal(removed.length, 0);
  const renamed = reduceMonitors([item], { type: "edit", id: "1", label: "Site" });
  assert.equal(renamed[0]?.label, "Site");
});
