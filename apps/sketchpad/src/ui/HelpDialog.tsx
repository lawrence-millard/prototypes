import { SHORTCUTS } from '../model/constants'
import { Dialog } from './Dialog'

export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose}>
      <ul className="shortcut-list">
        {SHORTCUTS.map((item) => (
          <li key={item.keys}>
            <kbd>{item.keys}</kbd>
            <span>{item.action}</span>
          </li>
        ))}
      </ul>
      <div className="dialog-actions">
        <button type="button" onClick={onClose}>Close</button>
      </div>
    </Dialog>
  )
}
