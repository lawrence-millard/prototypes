import { Component, useState, type ReactNode } from 'react'
import { AuthGate } from './auth/AuthGate'
import { useSession } from './auth/session'
import { AccountButton } from './ui/AccountButton'
import { Editor } from './ui/Editor'
import { Library } from './ui/Library'
import { FullScreenMessage } from './ui/messages'
import { ThemeToggle } from './ui/ThemeToggle'

type View = { kind: 'library' } | { kind: 'editor'; boardId: string; notice?: string }

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <FullScreenMessage
          title="Something went wrong"
          body="Reload to try again."
          action={
            <button type="button" onClick={() => window.location.reload()}>
              Reload
            </button>
          }
        />
      )
    }
    return this.props.children
  }
}

function Shell({ editor, children }: { editor: boolean; children: ReactNode }) {
  const session = useSession()
  return (
    <div className={editor ? 'app app-editor' : 'app'}>
      <a className="skip" href={editor ? '#canvas' : '#boards'}>
        {editor ? 'Skip to canvas' : 'Skip to boards'}
      </a>
      {editor ? null : (
        <header className="topbar">
          <div className="brand">
            <svg className="mark" viewBox="0 0 38 38" aria-hidden="true">
              <rect x="0.5" y="0.5" width="37" height="37" rx="8" fill="none" stroke="currentColor" />
              <rect x="8" y="14" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="26" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="brand-name">Sketchpad</span>
          </div>
          <div className="top-actions">
            {session.mode === 'clerk' ? <AccountButton /> : null}
          </div>
        </header>
      )}
      {children}
    </div>
  )
}

function Sketchpad() {
  const { ownerId } = useSession()
  const [view, setView] = useState<View>({ kind: 'library' })

  return (
    <Shell editor={view.kind === 'editor'}>
      {view.kind === 'library' ? (
        <div id="boards">
          <Library ownerId={ownerId} onOpen={(boardId, notice) => setView({ kind: 'editor', boardId, notice })} />
        </div>
      ) : (
        <Editor
          key={view.boardId}
          ownerId={ownerId}
          boardId={view.boardId}
          initialNotice={view.notice}
          onBack={() => setView({ kind: 'library' })}
        />
      )}
    </Shell>
  )
}

export function App() {
  return (
    <AppErrorBoundary>
      <ThemeToggle />
      <AuthGate>
        <Sketchpad />
      </AuthGate>
    </AppErrorBoundary>
  )
}
