import { useEffect, useMemo, useRef, useState } from 'react'
import { getBoard, putBoard } from '../db/database'
import { createAutosave, saveStatusLabel, type SaveStatus } from '../model/autosave'
import {
  addShape,
  connectShapes,
  deleteShape,
  moveShape,
  renameBoard,
  resizeShapeBy,
  shapeById,
  topShapeAt,
  updateShapeBounds,
  updateShapeFill,
  updateShapeText,
} from '../model/board'
import { AUTOSAVE_MS, FILLS, MAX_TEXT, SHAPE_DEFAULTS } from '../model/constants'
import { handleAt, resizeFromHandle } from '../model/geometry'
import { commitFromOrigin, commitHistory, createHistory, redoHistory, replacePresent, undoHistory, type History } from '../model/history'
import type { Board, Bounds, Handle, Point, Tool } from '../model/types'
import { Canvas } from './Canvas'
import { ExportDialog } from './ExportDialog'
import { HelpDialog } from './HelpDialog'
import { Toolbar } from './Toolbar'
import { storageMessage } from './messages'

type Drag =
  | { mode: 'move'; id: string; origin: Board; x: number; y: number }
  | { mode: 'resize'; id: string; handle: Handle; origin: Board; bounds: Bounds; x: number; y: number }

function isShapeTool(tool: Tool): tool is 'rectangle' | 'ellipse' | 'diamond' | 'text' {
  return tool === 'rectangle' || tool === 'ellipse' || tool === 'diamond' || tool === 'text'
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

export function Editor({
  ownerId,
  boardId,
  initialNotice,
  onBack,
}: {
  ownerId: string
  boardId: string
  initialNotice?: string
  onBack: () => void
}) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [history, setHistory] = useState<History<Board> | null>(null)
  const [selection, setSelection] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [hint, setHint] = useState('Pick a tool, then click the canvas.')
  const [notice, setNotice] = useState(initialNotice ?? null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [leaveError, setLeaveError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const historyRef = useRef<History<Board> | null>(null)
  const selectionRef = useRef<string | null>(null)
  const toolRef = useRef<Tool>('select')
  const connectFromRef = useRef<string | null>(null)
  const dialogRef = useRef(false)
  const dragRef = useRef<Drag | null>(null)
  const textOrigin = useRef<Board | null>(null)
  const nameDraftRef = useRef('')
  const nameFocus = useRef(false)
  historyRef.current = history
  selectionRef.current = selection
  toolRef.current = tool
  connectFromRef.current = connectFrom
  dialogRef.current = helpOpen || exportOpen
  nameDraftRef.current = nameDraft

  const saver = useMemo(() => createAutosave((next) => putBoard(ownerId, next), AUTOSAVE_MS), [ownerId])

  useEffect(() => {
    return saver.subscribe((status, message) => {
      setSaveStatus(status)
      setSaveError(message)
    })
  }, [saver])

  useEffect(() => {
    return () => {
      void saver.flush().finally(() => saver.dispose())
    }
  }, [saver])

  useEffect(() => {
    let cancelled = false
    setPhase('loading')
    setLoadError(null)
    setHistory(null)
    getBoard(ownerId, boardId)
      .then((found) => {
        if (cancelled) return
        if (!found) {
          setPhase('missing')
          return
        }
        const next = createHistory(found)
        historyRef.current = next
        setHistory(next)
        setNameDraft(found.name)
        setPhase('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(storageMessage(err, 'Could not open the board from this browser.'))
        setPhase('error')
      })
    return () => {
      cancelled = true
    }
  }, [ownerId, boardId, reloadKey])

  const loadedId = useRef<string | null>(null)
  useEffect(() => {
    if (!history) return
    if (loadedId.current !== history.present.id) {
      loadedId.current = history.present.id
      return
    }
    saver.schedule(history.present)
  }, [history, saver])

  useEffect(() => {
    if (!history || nameFocus.current) return
    setNameDraft(history.present.name)
  }, [history])

  useEffect(() => {
    if (!history) return
    document.title = `${history.present.name} — Sketchpad`
    return () => {
      document.title = 'Sketchpad'
    }
  }, [history])

  function applyHistory(next: History<Board>) {
    historyRef.current = next
    setHistory(next)
    const selected = selectionRef.current
    if (selected && !next.present.shapes.some((shape) => shape.id === selected)) {
      selectionRef.current = null
      setSelection(null)
    }
  }

  function preview(board: Board) {
    const current = historyRef.current
    if (!current) return
    const next = replacePresent(current, board)
    historyRef.current = next
    setHistory(next)
  }

  function clearFuture() {
    const current = historyRef.current
    if (!current || current.future.length === 0) return
    applyHistory({ ...current, future: [] })
  }

  function commitOpenEditors() {
    const origin = textOrigin.current
    textOrigin.current = null
    if (origin && historyRef.current) applyHistory(commitFromOrigin(historyRef.current, origin))
    const current = historyRef.current
    if (!current) return
    const result = renameBoard(current.present, nameDraftRef.current)
    if (!result.error) {
      setNameError(null)
      applyHistory(commitHistory(historyRef.current ?? current, result.board))
    }
  }

  async function leave() {
    commitOpenEditors()
    const latest = historyRef.current?.present
    if (latest) saver.schedule(latest)
    try {
      await saver.flush()
      onBack()
    } catch {
      setLeaveError(true)
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (dialogRef.current || isTypingTarget(event.target)) return
      const current = historyRef.current
      if (!current) return
      const meta = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (meta && key === 'z') {
        event.preventDefault()
        applyHistory(event.shiftKey ? redoHistory(current) : undoHistory(current))
        return
      }
      if (meta && key === 'y') {
        event.preventDefault()
        applyHistory(redoHistory(historyRef.current ?? current))
        return
      }
      if (meta && key === 's') {
        event.preventDefault()
        commitOpenEditors()
        const latest = historyRef.current?.present
        if (latest) saver.schedule(latest)
        void saver.flush().catch(() => undefined)
        return
      }
      if (event.key === '?' || (meta && event.key === '/')) {
        event.preventDefault()
        setHelpOpen(true)
        return
      }
      if (event.key === 'Escape') {
        setConnectFrom(null)
        setSelection(null)
        setTool('select')
        setHint('Selection cleared.')
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectionRef.current) {
        event.preventDefault()
        const id = selectionRef.current
        applyHistory(commitHistory(current, deleteShape(current.present, id)))
        setSelection(null)
        setConnectFrom((value) => (value === id ? null : value))
        setHint('Shape deleted.')
        return
      }

      const toolKeys: Record<string, Tool> = {
        v: 'select',
        r: 'rectangle',
        e: 'ellipse',
        d: 'diamond',
        t: 'text',
        c: 'connector',
      }
      if (!meta && !event.altKey && toolKeys[key]) {
        const nextTool = toolKeys[key]
        setTool(nextTool)
        if (nextTool !== 'connector') setConnectFrom(null)
        return
      }

      const selected = selectionRef.current
      if (!selected || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return
      event.preventDefault()
      const step = event.shiftKey ? 10 : event.altKey ? 1 : 1
      const amount = event.altKey ? (event.shiftKey ? 10 : 1) : step
      const dx = event.key === 'ArrowLeft' ? -amount : event.key === 'ArrowRight' ? amount : 0
      const dy = event.key === 'ArrowUp' ? -amount : event.key === 'ArrowDown' ? amount : 0
      const present = historyRef.current?.present ?? current.present
      const next = event.altKey ? resizeShapeBy(present, selected, dx, dy) : moveShape(present, selected, dx, dy)
      applyHistory(commitHistory(historyRef.current ?? current, next))
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saver])

  function onPointerDown(point: Point) {
    const current = historyRef.current
    if (!current) return
    const board = current.present
    const activeTool = toolRef.current

    if (activeTool === 'select') {
      const selected = selectionRef.current ? shapeById(board, selectionRef.current) : undefined
      const handle = selected ? handleAt(selected, point) : null
      if (selected && handle) {
        clearFuture()
        dragRef.current = {
          mode: 'resize',
          id: selected.id,
          handle,
          origin: historyRef.current?.present ?? board,
          bounds: { x: selected.x, y: selected.y, width: selected.width, height: selected.height },
          x: point.x,
          y: point.y,
        }
        return
      }
      const hit = topShapeAt(board, point)
      if (!hit) {
        setSelection(null)
        setHint('Nothing selected.')
        return
      }
      setSelection(hit.id)
      clearFuture()
      dragRef.current = {
        mode: 'move',
        id: hit.id,
        origin: historyRef.current?.present ?? board,
        x: point.x,
        y: point.y,
      }
      return
    }

    if (activeTool === 'connector') {
      const hit = topShapeAt(board, point)
      if (!hit) {
        setConnectFrom(null)
        setHint('Connector cancelled.')
        return
      }
      const from = connectFromRef.current
      if (!from) {
        setConnectFrom(hit.id)
        setSelection(hit.id)
        setHint('Choose the shape to connect to.')
        return
      }
      const result = connectShapes(board, from, hit.id)
      if (result.error) {
        setHint(result.error)
        return
      }
      applyHistory(commitHistory(current, result.board))
      setConnectFrom(null)
      setSelection(hit.id)
      setHint('Connected.')
      return
    }

    if (!isShapeTool(activeTool)) return
    const defaults = SHAPE_DEFAULTS[activeTool]
    const next = addShape(board, {
      kind: activeTool,
      x: point.x - defaults.width / 2,
      y: point.y - defaults.height / 2,
      width: defaults.width,
      height: defaults.height,
    })
    const created = next.shapes[next.shapes.length - 1]
    applyHistory(commitHistory(current, next))
    setSelection(created?.id ?? null)
    setHint(`${activeTool[0]?.toUpperCase() ?? ''}${activeTool.slice(1)} added.`)
  }

  function onPointerMove(point: Point) {
    const drag = dragRef.current
    const current = historyRef.current
    if (!drag || !current) return
    const dx = point.x - drag.x
    const dy = point.y - drag.y
    if (drag.mode === 'move') {
      preview(moveShape(drag.origin, drag.id, dx, dy))
      return
    }
    preview(updateShapeBounds(drag.origin, drag.id, resizeFromHandle(drag.bounds, drag.handle, dx, dy)))
  }

  function onPointerUp() {
    const drag = dragRef.current
    if (!drag || !historyRef.current) return
    dragRef.current = null
    applyHistory(commitFromOrigin(historyRef.current, drag.origin))
  }

  if (phase === 'loading') {
    return <main className="panel page-pad" role="status" aria-busy="true">Loading board…</main>
  }
  if (phase === 'missing') {
    return (
      <main className="panel page-pad">
        <h1>Board not found</h1>
        <p>That board is not in this browser.</p>
        <button type="button" onClick={onBack}>Back to boards</button>
      </main>
    )
  }
  if (phase === 'error' || !history) {
    return (
      <main className="panel page-pad" role="alert">
        <h1>Could not open the board</h1>
        <p>{loadError ?? 'Could not open the board from this browser.'}</p>
        <div className="page-actions">
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>Try again</button>
          <button type="button" onClick={onBack}>Back to boards</button>
        </div>
      </main>
    )
  }

  const board = history.present
  const selected = selection ? shapeById(board, selection) : undefined

  return (
    <div className="editor-page">
      <div className="editor-bar">
        <button type="button" onClick={() => void leave()}>Boards</button>
        <div className="name-field">
          <label htmlFor="board-name">Board name</label>
          <input
            id="board-name"
            value={nameDraft}
            maxLength={80}
            aria-invalid={nameError ? true : undefined}
            onFocus={() => {
              nameFocus.current = true
            }}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={() => {
              nameFocus.current = false
              const current = historyRef.current
              if (!current) return
              const result = renameBoard(current.present, nameDraftRef.current)
              if (result.error) {
                setNameError(result.error)
                return
              }
              setNameError(null)
              applyHistory(commitHistory(current, result.board))
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        </div>
        <button type="button" onClick={() => applyHistory(undoHistory(historyRef.current ?? history))} disabled={history.past.length === 0}>
          Undo
        </button>
        <button type="button" onClick={() => applyHistory(redoHistory(historyRef.current ?? history))} disabled={history.future.length === 0}>
          Redo
        </button>
        <button type="button" onClick={() => setExportOpen(true)}>Export</button>
        <button type="button" aria-label="Keyboard shortcuts" aria-keyshortcuts="?" onClick={() => setHelpOpen(true)}>
          Shortcuts
        </button>
      </div>
      {nameError ? <p className="banner banner-error" role="alert">{nameError}</p> : null}
      {notice ? <p className="banner" role="status">{notice}</p> : null}
      {leaveError ? (
        <p className="banner banner-error" role="alert">
          {saveError ?? 'Could not save the board in this browser.'}{' '}
          <button type="button" onClick={onBack}>Back anyway</button>
        </p>
      ) : null}
      <div className="editor">
        <Toolbar
          tool={tool}
          onTool={(next) => {
            setTool(next)
            if (next !== 'connector') setConnectFrom(null)
          }}
        />
        <Canvas
          board={board}
          tool={tool}
          selection={selection}
          connectFrom={connectFrom}
          onPointerDownPoint={onPointerDown}
          onPointerMovePoint={onPointerMove}
          onPointerUpPoint={onPointerUp}
        />
        <aside className="inspector" aria-label="Shape properties">
          {selected ? (
            <>
              <h2>{selected.kind}</h2>
              <label htmlFor="shape-text">Shape text</label>
              <textarea
                id="shape-text"
                aria-label="Shape text"
                rows={3}
                maxLength={MAX_TEXT}
                value={selected.text}
                onFocus={() => {
                  textOrigin.current = historyRef.current?.present ?? board
                }}
                onChange={(event) => {
                  const origin = textOrigin.current ?? historyRef.current?.present ?? board
                  textOrigin.current = origin
                  preview(updateShapeText(origin, selected.id, event.target.value))
                }}
                onBlur={() => {
                  const origin = textOrigin.current
                  textOrigin.current = null
                  if (!origin || !historyRef.current) return
                  applyHistory(commitFromOrigin(historyRef.current, origin))
                }}
              />
              <div className="swatches" role="group" aria-label="Fill color">
                {FILLS.map((fill) => (
                  <button
                    key={fill.id}
                    type="button"
                    className="swatch"
                    style={{ background: fill.value }}
                    aria-pressed={selected.fill === fill.value}
                    aria-label={`Fill ${fill.label}`}
                    onClick={() => {
                      const origin = textOrigin.current
                      textOrigin.current = null
                      const current = historyRef.current ?? history
                      const base = origin ? commitFromOrigin(current, origin) : current
                      applyHistory(commitHistory(base, updateShapeFill(base.present, selected.id, fill.value)))
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                className="danger-quiet"
                onClick={() => {
                  textOrigin.current = null
                  const current = historyRef.current ?? history
                  applyHistory(commitHistory(current, deleteShape(current.present, selected.id)))
                  setConnectFrom((value) => (value === selected.id ? null : value))
                  setHint('Shape deleted.')
                }}
              >
                Delete shape
              </button>
            </>
          ) : (
            <>
              <h2>Inspector</h2>
              <p>No shape selected. Choose Select, then click a shape. Or press V, R, E, D, T, or C.</p>
            </>
          )}
          {connectFrom ? <p>Connecting. Click another shape, or press Escape to cancel.</p> : null}
        </aside>
        <footer className="statusbar">
          <p data-testid="save-status" role="status">{saveStatusLabel(saveStatus)}</p>
          {saveError ? <p role="alert">{saveError}</p> : null}
          <p className="hint-line">{hint}</p>
        </footer>
      </div>
      {exportOpen ? (
        <ExportDialog
          board={board}
          onClose={() => setExportOpen(false)}
          onSuccess={(message) => setNotice(message)}
        />
      ) : null}
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
    </div>
  )
}
