import type { Board } from './types'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export function saveStatusLabel(status: SaveStatus): string {
  switch (status) {
    case 'pending':
      return 'Unsaved changes'
    case 'saving':
      return 'Saving…'
    case 'error':
      return 'Save failed'
    case 'saved':
    case 'idle':
      return 'Saved on this browser'
  }
}

export interface Autosave {
  schedule: (board: Board) => void
  flush: () => Promise<void>
  status: () => SaveStatus
  error: () => string | null
  subscribe: (listener: (status: SaveStatus, message: string | null) => void) => () => void
  dispose: () => void
}

function safeSaveMessage(err: unknown): string {
  if (err instanceof Error && err.message.startsWith('Could not')) return err.message
  return 'Could not save the board in this browser.'
}

export function createAutosave(save: (board: Board) => Promise<void>, delayMs: number): Autosave {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: Board | null = null
  let status: SaveStatus = 'idle'
  let error: string | null = null
  let disposed = false
  let chain: Promise<void> = Promise.resolve()
  const listeners = new Set<(status: SaveStatus, message: string | null) => void>()

  function emit(): void {
    for (const listener of listeners) listener(status, error)
  }

  function setStatus(next: SaveStatus, nextError: string | null = null): void {
    status = next
    error = nextError
    emit()
  }

  async function writePending(): Promise<void> {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    const board = pending
    pending = null
    if (!board) return
    setStatus('saving')
    try {
      await save(board)
      if (disposed) return
      if (pending) {
        setStatus('pending')
        await writePending()
        return
      }
      setStatus('saved')
    } catch (err) {
      const message = safeSaveMessage(err)
      setStatus('error', message)
      throw new Error(message)
    }
  }

  function flush(): Promise<void> {
    const run = chain.then(writePending, writePending)
    chain = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  return {
    schedule(board: Board) {
      pending = board
      setStatus('pending')
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        void flush().catch(() => undefined)
      }, delayMs)
    },
    flush,
    status: () => status,
    error: () => error,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispose() {
      disposed = true
      if (timer) clearTimeout(timer)
      timer = null
      listeners.clear()
    },
  }
}
