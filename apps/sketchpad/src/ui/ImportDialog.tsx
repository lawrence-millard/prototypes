import { useRef, useState } from 'react'
import { putBoard } from '../db/database'
import { MAX_IMPORT_CHARS } from '../model/constants'
import { importBoardJson } from '../model/transfer'
import type { Board } from '../model/types'
import { Dialog } from './Dialog'
import { storageMessage } from './messages'

export function ImportDialog({
  ownerId,
  onClose,
  onImported,
}: {
  ownerId: string
  onClose: () => void
  onImported: (board: Board) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(file: File | undefined) {
    if (!file || busy) return
    setError(null)
    if (file.size > MAX_IMPORT_CHARS) {
      setError('That file is larger than 1 MB.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setBusy(true)
    try {
      const text = await file.text()
      const result = importBoardJson(text)
      if (!result.ok) {
        setError(result.error)
        return
      }
      await putBoard(ownerId, result.board)
      onImported(result.board)
    } catch (err) {
      setError(storageMessage(err, 'Could not read that file.'))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <Dialog title="Import JSON" onClose={onClose}>
      <p id="import-hint">Sketchpad JSON only, up to 1 MB. Other files are rejected.</p>
      <label className="file-label" htmlFor="board-file">
        Board file
        <input
          ref={inputRef}
          id="board-file"
          type="file"
          accept="application/json,.json"
          aria-describedby="import-hint"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0]
            void onFile(file)
          }}
        />
      </label>
      {busy ? <p role="status">Checking the file…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <div className="dialog-actions">
        <button type="button" onClick={onClose} disabled={busy}>
          Close
        </button>
      </div>
    </Dialog>
  )
}
