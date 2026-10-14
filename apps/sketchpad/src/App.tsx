import { Component, lazy, Suspense, useState, type ReactNode } from 'react'
import { AuthGate } from './auth/AuthGate'
import { useSession } from './auth/session'
import { Editor } from './ui/Editor'
import { Library } from './ui/Library'
import { FullScreenMessage } from './ui/messages'
import { ThemeToggle } from './ui/ThemeToggle'

const UserButton = lazy(async () => {
  const module = await import('@clerk/clerk-react')
  return { default: module.UserButton }
})

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
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <span className="brand-name">Sketchpad</span>
        </div>
        <div className="top-actions">
          {session.mode === 'clerk' ? (
            <Suspense fallback={<span className="user-fallback">Account</span>}>
              <UserButton />
            </Suspense>
          ) : null}
        </div>
      </header>
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
