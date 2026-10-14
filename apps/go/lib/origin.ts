export function requestOrigin(hostHeader: string | null, protoHeader: string | null) {
  const host = hostHeader?.split(",")[0]?.trim() ?? ""
  if (!host || host.length > 255 || /[\s/]/.test(host)) return ""
  const proto = protoHeader?.split(",")[0]?.trim() === "http" ? "http" : "https"
  return `${proto}://${host}`
}
