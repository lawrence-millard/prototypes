'use client'

import { useState } from 'react'

export function RevealUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="reveal">
      <p>
        Copy this URL now. Hookbox stores only a hash of the token, so this is the only time it
        can be shown.
      </p>
      <div className="copy-row">
        <input
          readOnly
          value={url}
          aria-label="Webhook URL"
          spellCheck={false}
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          type="button"
          className="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
