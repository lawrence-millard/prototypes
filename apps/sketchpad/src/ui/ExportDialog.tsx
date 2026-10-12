import { useState } from 'react'
import { svgToPngBlob } from '../model/png'
import { renderBoardSvg } from '../model/svg'
import { downloadName, exportBoardJson } from '../model/transfer'
import type { Board } from '../model/types'
import { Dialog } from './Dialog'
import { downloadBlob } from './download'

export function ExportDialog({
  board,
  onClose,
  onSuccess,
}: {
  board: Board
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const [error, setError] = useState<string | null>(null)

  function downloadSvg() {
    setError(null)
    try {
      const rendered = renderBoardSvg(board)
      downloadBlob(downloadName(board.name, 'svg'), new Blob([rendered.svg], { type: 'image/svg+xml' }))
      onSuccess('Downloaded SVG.')
    } catch {
      setError('Could not create the SVG.')
    }
  }

  async function downloadPng() {
    setError(null)
    try {
      const rendered = renderBoardSvg(board)
      const blob = await svgToPngBlob(rendered.svg, rendered.width, rendered.height)
      downloadBlob(downloadName(board.name, 'png'), blob)
      onSuccess('Downloaded PNG.')
    } catch {
      setError('Could not create the PNG.')
    }
  }

  function downloadJson() {
    setError(null)
    try {
      downloadBlob(
        downloadName(board.name, 'json'),
        new Blob([exportBoardJson(board)], { type: 'application/json' }),
      )
      onSuccess('Downloaded JSON.')
    } catch {
      setError('Could not create the JSON file.')
    }
  }

  return (
    <Dialog title="Export board" onClose={onClose}>
      <p>Downloads stay on this computer. Nothing is uploaded.</p>
      <div className="stack">
        <button type="button" className="export-option" onClick={downloadSvg}>
          <strong>Download SVG</strong>
          <span>Vector drawing of this board.</span>
        </button>
        <button type="button" className="export-option" onClick={() => void downloadPng()}>
          <strong>Download PNG</strong>
          <span>Flat image, up to 2048 pixels on a side.</span>
        </button>
        <button type="button" className="export-option" onClick={downloadJson}>
          <strong>Download JSON</strong>
          <span>Sketchpad file you can import later. This is the backup.</span>
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="dialog-actions">
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </Dialog>
  )
}
