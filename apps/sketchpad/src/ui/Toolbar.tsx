import type { Tool } from '../model/types'
import { ToolIcon } from './icons'

const TOOLS: Array<{ id: Tool; label: string; shortcut: string }> = [
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'E' },
  { id: 'diamond', label: 'Diamond', shortcut: 'D' },
  { id: 'text', label: 'Text', shortcut: 'T' },
  { id: 'connector', label: 'Connector', shortcut: 'C' },
]

export function Toolbar({ tool, onTool }: { tool: Tool; onTool: (tool: Tool) => void }) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">
      {TOOLS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="tool"
          aria-pressed={tool === item.id}
          aria-label={item.label}
          aria-keyshortcuts={item.shortcut}
          onClick={() => onTool(item.id)}
        >
          <ToolIcon kind={item.id} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
