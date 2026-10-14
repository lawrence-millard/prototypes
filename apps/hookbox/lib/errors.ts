export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'unknown'
  return message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]').slice(0, 300)
}
