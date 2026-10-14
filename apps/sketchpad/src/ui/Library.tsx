import { MoreHorizontal } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { deleteBoard, deleteSampleBoards, loadLibrary, putBoard } from '../db/database'
import { syncOnLoad } from '../sync/client'
import { createBoard, renameBoard } from '../model/board'
import { createSampleBoard } from '../model/sample'
import type { Board } from '../model/types'
import { BoardThumb } from './BoardThumb'
import { Dialog } from './Dialog'
import { ImportDialog } from './ImportDialog'
import { storageMessage } from './messages'
import { absoluteTime, relativeTime } from './relative-time'
import { SyncStatus } from './SyncStatus'

export function Library({
  ownerId,
  onOpen,
}: {
  ownerId: string
  onOpen: (boardId: string, notice?: string) => void
}) {
  const [boards, setBoards] = useState<Board[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pending, setPending] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Board | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    setBoards(null)
    setLoadError(null)
    syncOnLoad(ownerId)
      .catch(() => undefined)
      .then(() => (cancelled ? null : loadLibrary(ownerId)))
      .then((next) => {
        if (!cancelled && next) setBoards(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(storageMessage(err, 'Could not load boards from this browser.'))
      })
    return () => {
      cancelled = true
    }
  }, [ownerId, reloadKey])

  async function refresh(): Promise<void> {
    const next = await loadLibrary(ownerId)
    setBoards(next)
  }

  async function create(): Promise<void> {
    if (pending) return
    setPending(true)
    setActionError(null)
    try {
      const board = createBoard()
      await putBoard(ownerId, board)
      onOpen(board.id, 'Board created.')
    } catch (err) {
      setActionError(storageMessage(err, 'Could not create a board in this browser.'))
      setPending(false)
    }
  }

  async function removeSamples(): Promise<void> {
    if (pending) return
    setPending(true)
    setActionError(null)
    try {
      await deleteSampleBoards(ownerId)
      await refresh()
      setNotice('Sample deleted.')
    } catch (err) {
      setActionError(storageMessage(err, 'Could not delete the sample data.'))
    } finally {
      setPending(false)
    }
  }

  async function addSample(): Promise<void> {
    if (pending) return
    setPending(true)
    setActionError(null)
    try {
      await putBoard(ownerId, createSampleBoard(), 'restore')
      await refresh()
      setNotice('Sample added.')
    } catch (err) {
      setActionError(storageMessage(err, 'Could not add the sample board.'))
    } finally {
      setPending(false)
    }
  }

  async function saveRename(board: Board): Promise<void> {
    const result = renameBoard(board, renameValue)
    if (result.error) {
      setRenameError(result.error)
      return
    }
    setPending(true)
    setActionError(null)
    try {
      await putBoard(ownerId, result.board)
      setRenamingId(null)
      setRenameError(null)
      await refresh()
      setNotice('Board renamed.')
    } catch (err) {
      setActionError(storageMessage(err, 'Could not rename the board.'))
    } finally {
      setPending(false)
    }
  }

  async function confirmRemove(): Promise<void> {
    if (!confirmDelete) return
    const board = confirmDelete
    setPending(true)
    setActionError(null)
    try {
      await deleteBoard(ownerId, board.id)
      setConfirmDelete(null)
      await refresh()
      setNotice(`Deleted "${board.name}".`)
    } catch (err) {
      setActionError(storageMessage(err, 'Could not delete the board.'))
    } finally {
      setPending(false)
    }
  }

  const ready = boards !== null && !loadError
  const hasSample = boards?.some((board) => board.sample) ?? false

  return (
    <main className="library">
      <div className="page-head">
        <div>
          <h1>Boards</h1>
          <SyncStatus />
        </div>
        <div className="page-actions">
          <button type="button" className="primary" onClick={() => void create()} disabled={!ready || pending}>
            New board
          </button>
          <button type="button" onClick={() => setImportOpen(true)} disabled={!ready || pending}>
            Import JSON
          </button>
          {ready && hasSample ? (
            <button type="button" className="quiet" onClick={() => void removeSamples()} disabled={pending}>
              Delete sample data
            </button>
          ) : null}
          {ready && !hasSample ? (
            <button type="button" className="quiet" onClick={() => void addSample()} disabled={pending}>
              Add sample board
            </button>
          ) : null}
        </div>
      </div>

      {notice ? <p className="banner" role="status">{notice}</p> : null}
      {actionError ? <p className="banner banner-error" role="alert">{actionError}</p> : null}

      {boards === null && !loadError ? (
        <p className="panel" role="status" aria-busy="true">Loading boards…</p>
      ) : null}

      {loadError ? (
        <div className="panel" role="alert">
          <h2>Could not load boards</h2>
          <p>{loadError}</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>
        </div>
      ) : null}

      {ready && boards.length === 0 ? (
        <div className="empty">
          <PreviewEmpty />
          <h2>No boards</h2>
        </div>
      ) : null}

      {ready && boards.length > 0 ? (
        <ul className="board-grid">
          {boards.map((board) => (
            <li key={board.id}>
              <article className="board-card">
                {renamingId === board.id ? (
                  <form
                    className="rename-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void saveRename(board)
                    }}
                  >
                    <label className="sr-only" htmlFor={`rename-${board.id}`}>
                      New name for {board.name}
                    </label>
                    <input
                      id={`rename-${board.id}`}
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      maxLength={80}
                      autoFocus
                    />
                    {renameError ? <p role="alert">{renameError}</p> : null}
                    <div className="card-actions">
                      <button type="submit" className="primary" disabled={pending}>Save name</button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(null)
                          setRenameError(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button type="button" className="card-hit" aria-label={`Open ${board.name}`} onClick={() => onOpen(board.id)}>
                      <BoardThumb board={board} />
                      <span className="card-copy">
                        {board.sample ? <span className="badge">Sample</span> : null}
                        <h2>{board.name}</h2>
                        <span className="meta" title={absoluteTime(board.updatedAt)}>
                          {relativeTime(board.updatedAt, now)} · {board.shapes.length} shapes
                        </span>
                      </span>
                    </button>
                    <CardMenu
                      name={board.name}
                      onRename={() => {
                        setRenamingId(board.id)
                        setRenameValue(board.name)
                        setRenameError(null)
                      }}
                      onDelete={() => setConfirmDelete(board)}
                    />
                  </>
                )}
              </article>
            </li>
          ))}
        </ul>
      ) : null}

      {importOpen ? (
        <ImportDialog
          ownerId={ownerId}
          onClose={() => setImportOpen(false)}
          onImported={(board) => {
            setImportOpen(false)
            onOpen(board.id, `Imported "${board.name}".`)
          }}
        />
      ) : null}

      {confirmDelete ? (
        <Dialog title="Delete board" onClose={() => setConfirmDelete(null)}>
          <p>Delete "{confirmDelete.name}"?</p>
          <div className="dialog-actions">
            <button type="button" className="danger" onClick={() => void confirmRemove()} disabled={pending}>
              Delete board
            </button>
            <button type="button" onClick={() => setConfirmDelete(null)} disabled={pending}>
              Cancel
            </button>
          </div>
        </Dialog>
      ) : null}
    </main>
  )
}

function CardMenu({ name, onRename, onDelete }: { name: string; onRename: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="card-menu" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {open ? (
        <div className="menu" id={menuId} role="menu">
          <button
            type="button"
            role="menuitem"
            aria-label={`Rename ${name}`}
            onClick={() => {
              setOpen(false)
              onRename()
            }}
          >
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            aria-label={`Delete ${name}`}
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

function PreviewEmpty() {
  return (
    <svg className="empty-art" viewBox="0 0 180 72" aria-hidden="true">
      <rect x="8" y="16" width="64" height="40" rx="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="72" y1="36" x2="108" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="142" cy="36" rx="30" ry="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
