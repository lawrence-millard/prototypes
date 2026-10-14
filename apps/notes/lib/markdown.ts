function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function inline(value: string) {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, href: string) => {
      const raw = href.replace(/&amp;/g, "&").replace(/&quot;/g, '"')
      try {
        const url = new URL(raw)
        if (url.protocol !== "http:" && url.protocol !== "https:") return text
        return `<a href="${escapeHtml(url.href)}">${text}</a>`
      } catch {
        return text
      }
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
}

export function renderMarkdown(source: string) {
  const escaped = escapeHtml(source.replace(/\0/g, "").replace(/\r\n/g, "\n"))
  const blocks: string[] = []
  const text = escaped.replace(/```([\s\S]*?)```/g, (_match, code: string) => {
    const inner = code.replace(/^\n/, "").replace(/\n$/, "")
    blocks.push(`<pre><code>${inner}</code></pre>`)
    return `\u0000${blocks.length - 1}\u0000`
  })
  const html: string[] = []
  let list: string[] | null = null
  const flush = () => {
    if (!list) return
    html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`)
    list = null
  }
  for (const line of text.split("\n")) {
    const fence = /^\u0000(\d+)\u0000$/.exec(line)
    if (fence) {
      flush()
      html.push(blocks[Number(fence[1])] ?? "")
      continue
    }
    if (line.startsWith("- ")) {
      list ??= []
      list.push(line.slice(2))
      continue
    }
    flush()
    if (!line.trim()) continue
    if (line.startsWith("### ")) html.push(`<h3>${inline(line.slice(4))}</h3>`)
    else if (line.startsWith("## ")) html.push(`<h2>${inline(line.slice(3))}</h2>`)
    else if (line.startsWith("# ")) html.push(`<h2>${inline(line.slice(2))}</h2>`)
    else html.push(`<p>${inline(line)}</p>`)
  }
  flush()
  return html.join("")
}
