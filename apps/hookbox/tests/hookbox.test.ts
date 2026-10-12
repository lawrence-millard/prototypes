import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { embedAccent, renderDiscord, safeHref } from '../components/discord'
import { isPublicPath } from '../lib/access'
import { clerkEnabled, emailIsAllowed, parseAllowedEmails } from '../lib/clerk-mode'
import { SESSION_SECONDS } from '../lib/constants'
import { buildContentSecurityPolicy, clerkCspDirectives } from '../lib/csp'
import { headerSubset, readLimitedBody } from '../lib/http'
import { parseInbound } from '../lib/parse'
import { signSession, verifySessionToken } from '../lib/session'
import { cleanName, slugify, withSlugSuffix } from '../lib/slug'
import { newWebhookToken, tokenMatches } from '../lib/token'

const secret = 'test-session-secret-with-32-characters'

test('public paths are login, clerk screens, robots, and ingest', () => {
  assert.equal(isPublicPath('/login'), true)
  assert.equal(isPublicPath('/login/'), true)
  assert.equal(isPublicPath('/login/factor-one'), true)
  assert.equal(isPublicPath('/login-extra'), false)
  assert.equal(isPublicPath('/sign-up'), true)
  assert.equal(isPublicPath('/sign-up/verify'), true)
  assert.equal(isPublicPath('/sign-up-extra'), false)
  assert.equal(isPublicPath('/forbidden'), true)
  assert.equal(isPublicPath('/__clerk/v1/client'), true)
  assert.equal(isPublicPath('/robots.txt'), true)
  assert.equal(isPublicPath('/api/hook/11111111-1111-4111-8111-111111111111/token'), true)
  assert.equal(isPublicPath('/api/hook'), false)
  assert.equal(isPublicPath('/'), false)
  assert.equal(isPublicPath('/hooks/11111111-1111-4111-8111-111111111111'), false)
})

test('clerk turns on only when both keys are set, and emails must be verified', () => {
  assert.equal(clerkEnabled({}), false)
  assert.equal(clerkEnabled({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_x' }), false)
  assert.equal(clerkEnabled({ CLERK_SECRET_KEY: 'sk_test_x' }), false)
  assert.equal(
    clerkEnabled({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ' pk_test_x ', CLERK_SECRET_KEY: 'sk_test_x' }),
    true,
  )
  const allowlist = parseAllowedEmails(' Owner@Example.com, not-an-email, second@example.com ')
  assert.deepEqual([...allowlist], ['owner@example.com', 'second@example.com'])
  assert.equal(parseAllowedEmails('').size, 0)
  const verified = { verification: { status: 'verified' } }
  assert.equal(emailIsAllowed([{ emailAddress: 'OWNER@example.com', ...verified }], allowlist), true)
  assert.equal(
    emailIsAllowed([{ emailAddress: 'owner@example.com', verification: { status: 'unverified' } }], allowlist),
    false,
  )
  assert.equal(emailIsAllowed([{ emailAddress: 'other@example.com', ...verified }], allowlist), false)
  assert.equal(emailIsAllowed([{ emailAddress: 'second@example.com', verification: null }], allowlist), false)
})

test('production CSP is strict', () => {
  const csp = buildContentSecurityPolicy('abc123', { dev: false, https: true })
  assert.match(csp, /script-src 'self' 'nonce-abc123' 'strict-dynamic'/)
  assert.doesNotMatch(csp, /unsafe-inline/)
  assert.doesNotMatch(csp, /unsafe-eval/)
  assert.match(csp, /frame-ancestors 'none'/)
  assert.match(csp, /upgrade-insecure-requests/)
  const local = buildContentSecurityPolicy('abc123', { dev: false, https: false })
  assert.doesNotMatch(local, /upgrade-insecure-requests/)
  assert.doesNotMatch(csp, /clerk/)
  assert.deepEqual(clerkCspDirectives(true)['frame-ancestors'], ["'none'"])
  assert.deepEqual(clerkCspDirectives(true)['object-src'], ["'none'"])
  assert.deepEqual(clerkCspDirectives(false)['upgrade-insecure-requests'], undefined)
})

test('clerk strict CSP keeps the nonce and Hookbox frame lock', async () => {
  const file = path.resolve(
    import.meta.dirname,
    '../node_modules/@clerk/nextjs/dist/esm/server/content-security-policy.js',
  )
  const mod = await import(pathToFileURL(file).href)
  const created = mod.createContentSecurityPolicyHeaders('example.clerk.accounts.dev', {
    strict: true,
    directives: clerkCspDirectives(true),
  })
  const csp = headerValue(created.headers, 'content-security-policy')
  const script = csp.split(';').find((part: string) => part.trim().startsWith('script-src')) ?? ''
  assert.match(script, /strict-dynamic/)
  assert.match(script, /nonce-/)
  assert.doesNotMatch(script, /(^|\s)https:(\s|$)/)
  assert.match(csp, /frame-ancestors 'none'/)
  assert.match(csp, /object-src 'none'/)
  assert.match(csp, /https:\/\/\*\.protect\.clerk\.com/)
  assert.match(csp, /upgrade-insecure-requests/)
  assert.match(csp, /style-src 'self' 'unsafe-inline'/)
  assert.match(csp, /example\.clerk\.accounts\.dev/)
})

function headerValue(headers: Array<[string, string]>, name: string): string {
  return headers.find(([key]) => key.toLowerCase() === name)?.[1] ?? ''
}

test('session cookie round trip rejects tampering and expiry', async () => {
  const token = await signSession('admin', secret, 0)
  assert.equal(await verifySessionToken(token, secret, 'admin', 0), true)
  assert.equal(await verifySessionToken(token, secret, 'other', 0), false)
  assert.equal(await verifySessionToken(token, 'short', 'admin', 0), false)
  assert.equal(
    await verifySessionToken(token, secret, 'admin', (SESSION_SECONDS + 5) * 1000),
    false,
  )
  const [payload, signature] = token.split('.')
  const flipped = `${signature?.slice(0, -1)}${signature?.endsWith('a') ? 'b' : 'a'}`
  assert.equal(await verifySessionToken(`${payload}.${flipped}`, secret, 'admin', 0), false)
})

test('webhook tokens are 32 bytes and compared in constant time', () => {
  const token = newWebhookToken()
  assert.ok(token.length >= 43)
  assert.match(token, /^[A-Za-z0-9_-]+$/)
  const hex = createHash('sha256').update(token).digest('hex')
  assert.equal(tokenMatches(token, hex), true)
  assert.equal(tokenMatches(`${token}x`, hex), false)
  assert.equal(tokenMatches('short', null), false)
  assert.equal(tokenMatches('x'.repeat(500), 'zz'), false)
})

test('names become unique slugs', () => {
  assert.equal(slugify('Deploy notifications'), 'deploy-notifications')
  assert.equal(slugify('Café alerts'), 'cafe-alerts')
  assert.equal(slugify('***'), 'hook')
  assert.equal(cleanName('  a   b  '), 'a b')
  assert.equal(cleanName(''), null)
  assert.equal(cleanName('a'.repeat(81)), null)
  assert.equal(withSlugSuffix('deploy-notifications', 2), 'deploy-notifications-2')
})

test('header subset drops credentials', () => {
  const headers = new Headers({
    'user-agent': 'discord/1',
    authorization: 'Bearer secret',
    cookie: 'session=nope',
    'content-type': 'application/json',
  })
  const subset = headerSubset(headers)
  assert.deepEqual(subset, {
    'content-type': 'application/json',
    'user-agent': 'discord/1',
  })
})

test('body reader enforces the limit', async () => {
  const small = new Request('http://hookbox.local/', { method: 'POST', body: 'hello' })
  assert.equal(new TextDecoder().decode((await readLimitedBody(small, 10)) ?? new Uint8Array()), 'hello')
  const large = new Request('http://hookbox.local/', {
    method: 'POST',
    body: 'x'.repeat(50),
  })
  assert.equal(await readLimitedBody(large, 10), null)
})

test('discord json, text, and multipart payloads parse', async () => {
  const json = JSON.stringify({
    content: 'hello **world**',
    username: 'deploy',
    avatar_url: 'https://example.com/a.png',
    embeds: [{ title: 'Build' }],
  })
  const parsed = await parseInbound(
    'application/json',
    new TextEncoder().encode(json),
  )
  assert.equal(parsed.content, 'hello **world**')
  assert.equal(parsed.username, 'deploy')
  assert.equal(parsed.avatarUrl, 'https://example.com/a.png')
  assert.equal(parsed.embeds?.length, 1)
  assert.equal(parsed.rawEncoding, 'utf8')

  const text = await parseInbound('text/plain', new TextEncoder().encode('plain line'))
  assert.equal(text.content, 'plain line')
  assert.equal(text.payload, null)

  const form = new FormData()
  form.set('payload_json', JSON.stringify({ content: 'from file', username: 'bot' }))
  form.set('files[0]', new File([new Uint8Array([1, 2, 3, 4])], 'note.txt', { type: 'text/plain' }))
  const request = new Request('http://hookbox.local/', { method: 'POST', body: form })
  const multipart = await parseInbound(
    request.headers.get('content-type') ?? '',
    new Uint8Array(await request.arrayBuffer()),
  )
  assert.equal(multipart.content, 'from file')
  assert.equal(multipart.username, 'bot')
  assert.equal(multipart.attachments[0]?.name, 'note.txt')
  assert.equal(multipart.attachments[0]?.size, 4)
})

function markup(node: ReturnType<typeof renderDiscord>): string {
  return renderToStaticMarkup(createElement(Fragment, null, node))
}

test('discord rendering escapes markup and blocks unsafe links', () => {
  const attack = markup(renderDiscord('<script>alert(1)</script> **bold** [x](javascript:alert(1))'))
  assert.equal(attack.includes('<script'), false)
  assert.ok(attack.includes('&lt;script&gt;'))
  assert.ok(attack.includes('<strong>bold</strong>'))
  assert.equal(attack.includes('href="javascript:'), false)

  const link = markup(renderDiscord('[docs](https://example.com/hook)'))
  assert.ok(link.includes('href="https://example.com/hook"'))
  assert.ok(link.includes('rel="noreferrer noopener"'))
  assert.equal(safeHref('javascript:alert(1)'), null)
  assert.equal(embedAccent(0xff0000), '#ff0000')
  assert.equal(embedAccent('red'), '#4c6b62')
})

test('app source does not inject HTML or publish secrets', async () => {
  const root = path.resolve(import.meta.dirname, '..')
  const source = await readTree(root)
  assert.equal(source.includes('dangerouslySetInnerHTML'), false)
  const publicEnv = [...new Set(source.match(/NEXT_PUBLIC_[A-Z0-9_]+/g) ?? [])]
  assert.deepEqual(publicEnv, ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'])
  assert.equal(source.includes('INGEST_TOKEN'), false)
})

async function readTree(dir: string): Promise<string> {
  const skip = new Set(['node_modules', '.next', 'tests'])
  const entries = await readdir(dir, { withFileTypes: true })
  const chunks: string[] = []
  for (const entry of entries) {
    if (skip.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      chunks.push(await readTree(full))
      continue
    }
    if (!/\.(ts|tsx|mjs|css)$/.test(entry.name)) continue
    if (entry.name === 'package-lock.json') continue
    chunks.push(await readFile(full, 'utf8'))
  }
  return chunks.join('\n')
}
