import { describe, expect, it } from 'vitest'
import { relativeTime } from './relative-time'

describe('relativeTime', () => {
  const now = Date.parse('2026-10-14T12:00:00Z')

  it('labels the last minute as just now', () => {
    expect(relativeTime(now - 20_000, now)).toBe('Just now')
  })

  it('uses minutes, hours, then days', () => {
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m ago')
    expect(relativeTime(now - 3 * 60 * 60_000, now)).toBe('3h ago')
    expect(relativeTime(now - 4 * 24 * 60 * 60_000, now)).toBe('4d ago')
  })
})
