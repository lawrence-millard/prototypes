export function safeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (url.username || url.password) return null
    if (url.href.length > 2000) return null
    return url.href
  } catch {
    return null
  }
}
