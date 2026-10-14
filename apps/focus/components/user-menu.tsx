'use client'

import { useState } from 'react'
import { UserButton } from '@clerk/nextjs'

const appearance = {
  variables: {
    colorPrimary: 'rgb(var(--c-fg))',
    colorBackground: 'rgb(var(--c-bg))',
    colorText: 'rgb(var(--c-fg))',
    colorTextSecondary: 'rgb(var(--c-mute))',
    borderRadius: '8px',
    fontFamily: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    userButtonAvatarBox: { width: '32px', height: '32px' },
    userButtonPopoverCard: { boxShadow: 'none', border: '1px solid rgba(124,124,124,0.35)' },
    userButtonPopoverActionButton: { boxShadow: 'none' },
    userButtonPopoverActionButtonIcon: { color: 'inherit' },
  },
}

function PreviewMenu() {
  const [open, setOpen] = useState(false)
  return (
    <div className="menu">
      <button type="button" className="avatar" aria-label="Account" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        M
      </button>
      {open ? (
        <div className="menu-panel" role="menu">
          <p className="menu-name">Millard</p>
          <button type="button" className="menu-item" role="menuitem">Sign out</button>
        </div>
      ) : null}
    </div>
  )
}

export function UserMenu({ preview = false }: { preview?: boolean }) {
  if (preview) return <PreviewMenu />
  return <UserButton appearance={appearance} />
}
