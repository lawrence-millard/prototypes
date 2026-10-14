import { Circle, Diamond, MousePointer2, Spline, Square, Type, type LucideIcon } from 'lucide-react'
import type { Tool } from '../model/types'

const TOOLS: Array<{ id: Tool; label: string; shortcut: string; icon: LucideIcon }> = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: MousePointer2 },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: Square },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'E', icon: Circle },
  { id: 'diamond', label: 'Diamond', shortcut: 'D', icon: Diamond },
  { id: 'text', label: 'Text', shortcut: 'T', icon: Type },
  { id: 'connector', label: 'Connector', shortcut: 'C', icon: Spline },
]

export function Toolbar({ tool, onTool }: { tool: Tool; onTool: (tool: Tool) => void }) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Drawing tools">
      {TOOLS.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            className="tool"
            aria-pressed={tool === item.id}
            aria-label={item.label}
            aria-keyshortcuts={item.shortcut}
            onClick={() => onTool(item.id)}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className="tip">
              {item.label}
              <kbd>{item.shortcut}</kbd>
            </span>
          </button>
        )
      })}
    </div>
  )
}
