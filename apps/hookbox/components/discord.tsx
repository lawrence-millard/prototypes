import { RENDER_TEXT_LIMIT } from '@/lib/constants'
import type { Attachment } from '@/lib/types'
import React, { type ReactNode } from 'react'

type Keys = { n: number }

export function DiscordMessage({
  content,
  username,
  embeds,
  attachments,
}: {
  content: string | null
  username: string | null
  embeds: unknown
  attachments: Attachment[]
}) {
  const initial = (username?.trim()[0] ?? '?').toUpperCase()
  const shown = content ? content.slice(0, RENDER_TEXT_LIMIT) : null
  return (
    <div className="discord">
      <div className="avatar" aria-hidden="true">
        {initial}
      </div>
      <div className="discord-main">
        <div className="discord-user">{username?.trim() || 'Webhook'}</div>
        {shown ? <div className="discord-content">{renderDiscord(shown)}</div> : null}
        {content && content.length > RENDER_TEXT_LIMIT ? (
          <p className="truncated">Content truncated in the preview. The full body is in the raw payload.</p>
        ) : null}
        {renderEmbeds(embeds)}
        {attachments.length > 0 ? (
          <ul className="files">
            {attachments.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span>{file.name}</span>
                <span>
                  {file.type || 'file'} · {file.size} bytes
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

export function renderDiscord(input: string): ReactNode {
  const keys: Keys = { n: 0 }
  const blocks: ReactNode[] = []
  const pattern = /```([^\n`]*)\n?([\s\S]*?)```/g
  let last = 0
  for (const match of input.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > last) blocks.push(...renderTextBlock(input.slice(last, index), keys))
    const lang = (match[1] ?? '').trim()
    blocks.push(
      <pre key={keys.n++} className="codeblock">
        {lang ? <span className="lang">{lang}</span> : null}
        {match[2] ?? ''}
      </pre>,
    )
    last = index + match[0].length
  }
  if (last < input.length) blocks.push(...renderTextBlock(input.slice(last), keys))
  return blocks
}

function renderTextBlock(text: string, keys: Keys): ReactNode[] {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let quote: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push(<p key={keys.n++}>{renderInline(paragraph.join('\n'), keys)}</p>)
    paragraph = []
  }
  const flushQuote = () => {
    if (quote.length === 0) return
    blocks.push(<blockquote key={keys.n++}>{renderInline(quote.join('\n'), keys)}</blockquote>)
    quote = []
  }

  for (const line of lines) {
    if (line.startsWith('> ') || line === '>') {
      flushParagraph()
      quote.push(line.startsWith('> ') ? line.slice(2) : '')
    } else {
      flushQuote()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushQuote()
  return blocks
}

function renderInline(text: string, keys: Keys): ReactNode[] {
  const nodes: ReactNode[] = []
  let buffer = ''
  let i = 0
  const flush = () => {
    if (!buffer) return
    nodes.push(buffer)
    buffer = ''
  }

  while (i < text.length) {
    if (text.startsWith('```', i)) {
      buffer += text[i]
      i += 1
      continue
    }
    if (text[i] === '\n') {
      flush()
      nodes.push(<br key={keys.n++} />)
      i += 1
      continue
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end > i + 1) {
        flush()
        nodes.push(<code key={keys.n++}>{text.slice(i + 1, end)}</code>)
        i = end + 1
        continue
      }
    }
    const wrapped = takeWrapped(text, i, '||', 'spoiler', keys)
      ?? takeWrapped(text, i, '**', 'strong', keys)
      ?? takeWrapped(text, i, '__', 'u', keys)
      ?? takeWrapped(text, i, '~~', 's', keys)
    if (wrapped) {
      flush()
      nodes.push(wrapped.node)
      i = wrapped.next
      continue
    }
    if (text[i] === '[') {
      const link = takeLink(text, i, keys)
      if (link) {
        flush()
        nodes.push(link.node)
        i = link.next
        continue
      }
    }
    if ((text[i] === '*' || text[i] === '_') && text[i + 1] !== text[i]) {
      const end = text.indexOf(text[i]!, i + 1)
      if (end > i + 1) {
        flush()
        nodes.push(<em key={keys.n++}>{renderInline(text.slice(i + 1, end), keys)}</em>)
        i = end + 1
        continue
      }
    }
    const url = /^(https?:\/\/[^\s<]+)/.exec(text.slice(i))
    if (url) {
      const raw = trimUrl(url[1] ?? '')
      const href = safeHref(raw)
      if (href) {
        flush()
        nodes.push(
          <a key={keys.n++} href={href} rel="noreferrer noopener" target="_blank">
            {raw}
          </a>,
        )
        i += raw.length
        continue
      }
    }
    buffer += text[i]
    i += 1
  }
  flush()
  return nodes
}

function takeWrapped(
  text: string,
  index: number,
  marker: string,
  kind: 'spoiler' | 'strong' | 'u' | 's',
  keys: Keys,
): { node: ReactNode; next: number } | null {
  if (!text.startsWith(marker, index)) return null
  const end = text.indexOf(marker, index + marker.length)
  if (end === -1) return null
  const inner = renderInline(text.slice(index + marker.length, end), keys)
  const key = keys.n++
  const node =
    kind === 'spoiler' ? (
      <details key={key} className="spoiler">
        <summary>Spoiler</summary>
        {inner}
      </details>
    ) : kind === 'strong' ? (
      <strong key={key}>{inner}</strong>
    ) : kind === 'u' ? (
      <u key={key}>{inner}</u>
    ) : (
      <s key={key}>{inner}</s>
    )
  return { node, next: end + marker.length }
}

function takeLink(
  text: string,
  index: number,
  keys: Keys,
): { node: ReactNode; next: number } | null {
  const close = text.indexOf(']', index + 1)
  if (close === -1 || text[close + 1] !== '(') return null
  const end = text.indexOf(')', close + 2)
  if (end === -1) return null
  const label = text.slice(index + 1, close)
  const href = safeHref(text.slice(close + 2, end).trim())
  if (!href) return null
  return {
    node: (
      <a key={keys.n++} href={href} rel="noreferrer noopener" target="_blank">
        {renderInline(label, keys)}
      </a>
    ),
    next: end + 1,
  }
}

function renderEmbeds(embeds: unknown): ReactNode {
  if (!Array.isArray(embeds)) return null
  return (
    <div className="embeds">
      {embeds.slice(0, 10).map((embed, index) => (
        <EmbedCard key={index} embed={embed} />
      ))}
    </div>
  )
}

function EmbedCard({ embed }: { embed: unknown }) {
  if (!isRecord(embed)) return null
  const keys: Keys = { n: 0 }
  const title = asString(embed.title)
  const description = asString(embed.description)
  const href = safeHref(asString(embed.url) ?? '')
  const fields = Array.isArray(embed.fields) ? embed.fields.slice(0, 25) : []
  const author = isRecord(embed.author) ? asString(embed.author.name) : null
  const footer = isRecord(embed.footer) ? asString(embed.footer.text) : null
  const image = isRecord(embed.image) ? asString(embed.image.url) : null
  const thumbnail = isRecord(embed.thumbnail) ? asString(embed.thumbnail.url) : null
  const accent = embedAccent(embed.color)

  return (
    <article className="embed">
      <svg className="accent" viewBox="0 0 4 40" preserveAspectRatio="none" aria-hidden="true">
        <rect width="4" height="40" fill={accent} />
      </svg>
      <div className="embed-body">
        {author ? <div className="embed-author">{author}</div> : null}
        {title ? (
          href ? (
            <a className="embed-title" href={href} rel="noreferrer noopener" target="_blank">
              {title}
            </a>
          ) : (
            <div className="embed-title">{title}</div>
          )
        ) : null}
        {description ? (
          <div className="embed-description">{renderDiscord(description.slice(0, RENDER_TEXT_LIMIT))}</div>
        ) : null}
        {fields.length > 0 ? (
          <div className="fields">
            {fields.map((field, index) => {
              if (!isRecord(field)) return null
              const name = asString(field.name) ?? ''
              const value = asString(field.value) ?? ''
              return (
                <div key={index} className={field.inline === true ? 'field inline' : 'field'}>
                  <div className="field-name">{name}</div>
                  <div className="field-value">{renderInline(value.slice(0, RENDER_TEXT_LIMIT), keys)}</div>
                </div>
              )
            })}
          </div>
        ) : null}
        {image ? <SafeUrl label="Image" value={image} /> : null}
        {thumbnail ? <SafeUrl label="Thumbnail" value={thumbnail} /> : null}
        {footer ? <div className="embed-footer">{footer}</div> : null}
      </div>
    </article>
  )
}

function SafeUrl({ label, value }: { label: string; value: string }) {
  const href = safeHref(value)
  return (
    <p className="embed-url">
      {label}:{' '}
      {href ? (
        <a href={href} rel="noreferrer noopener" target="_blank">
          {value}
        </a>
      ) : (
        value
      )}
    </p>
  )
}

export function embedAccent(color: unknown): string {
  if (typeof color !== 'number' || !Number.isInteger(color) || color < 0 || color > 0xffffff) {
    return '#4c6b62'
  }
  return `#${color.toString(16).padStart(6, '0')}`
}

export function safeHref(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

function trimUrl(value: string): string {
  return value.replace(/[),.;!?]+$/g, '')
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
