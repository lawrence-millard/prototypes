export function cleanName(input: string): string | null {
  const name = input.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (name.length < 1 || name.length > 80) return null
  if (/[\u0000-\u001f\u007f]/.test(name)) return null
  return name
}

export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '')
  return slug || 'hook'
}

export function withSlugSuffix(base: string, n: number): string {
  if (n <= 1) return base.slice(0, 48)
  const suffix = `-${n}`
  const trimmed = base.slice(0, Math.max(1, 48 - suffix.length)).replace(/-+$/g, '')
  return `${trimmed || 'hook'}${suffix}`
}
