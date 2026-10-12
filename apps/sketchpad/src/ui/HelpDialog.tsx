import { SHORTCUTS } from '../model/constants'
import { Dialog } from './Dialog'

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose}>
      <p>Shortcuts work unless the cursor is in a text field.</p>
      <ul className="shortcut-list">
        {SHORTCUTS.map((item) => (
          <li key={item.keys}>
            <kbd>{item.keys}</kbd>
            <span>{item.action}</span>
          </li>
        ))}
      </ul>
      <p>
        Connectors store the shapes they join, and the line is redrawn from those shapes. Moving or
        resizing a shape keeps the arrow attached. Scroll the canvas with the scrollbar or trackpad.
      </p>
      <div className="dialog-actions">
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </Dialog>
  )
}
