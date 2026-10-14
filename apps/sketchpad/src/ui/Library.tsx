import { useEffect, useState } from 'react'
import { deleteBoard, deleteSampleBoards, loadLibrary, putBoard } from '../db/database'
import { syncOnLoad } from '../sync/client'
import { createBoard, renameBoard } from '../model/board'
import { createSampleBoard } from '../model/sample'
import type { Board } from '../model/types'
import { Dialog } from './Dialog'
import { ImportDialog } from './ImportDialog'
import { storageMessage } from './messages'

function formatUpdated(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

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
        </div>
        <div className="page-actions">
          <button type="button" className="primary" onClick={() => void create()} disabled={!ready || pending}>
            New board
          </button>
          <button type="button" onClick={() => setImportOpen(true)} disabled={!ready || pending}>
            Import JSON
          </button>
          {ready && hasSample ? (
            <button type="button" className="danger-quiet" onClick={() => void removeSamples()} disabled={pending}>
              Delete sample data
            </button>
          ) : null}
          {ready && !hasSample ? (
            <button type="button" onClick={() => void addSample()} disabled={pending}>
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
          <div className="empty-art" aria-hidden="true">
            <span className="art-rect" />
            <span className="art-line" />
            <span className="art-ellipse" />
          </div>
          <h2>No boards</h2>
        </div>
      ) : null}

      {ready && boards.length > 0 ? (
        <ul className="board-grid">
          {boards.map((board) => (
            <li key={board.id}>
              <article className="board-card">
                <div className="card-top">
                  {board.sample ? <span className="badge">Sample</span> : null}
                  {renamingId === board.id ? (
                    <form
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
                    <h2>{board.name}</h2>
                  )}
                </div>
                <p className="meta">
                  {board.shapes.length} shapes · {board.connectors.length} connectors · Updated {formatUpdated(board.updatedAt)}
                </p>
                {renamingId === board.id ? null : (
                  <div className="card-actions">
                    <button type="button" className="primary" aria-label={`Open ${board.name}`} onClick={() => onOpen(board.id)}>
                      Open
                    </button>
                    <button
                      type="button"
                      aria-label={`Rename ${board.name}`}
                      onClick={() => {
                        setRenamingId(board.id)
                        setRenameValue(board.name)
                        setRenameError(null)
                      }}
                    >
                      Rename
                    </button>
                    <button type="button" className="danger-quiet" aria-label={`Delete ${board.name}`} onClick={() => setConfirmDelete(board)}>
                      Delete
                    </button>
                  </div>
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
