export function ToolIcon({ kind }: { kind: 'select' | 'rectangle' | 'ellipse' | 'diamond' | 'text' | 'connector' }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      {kind === 'select' ? (
        <path d="M5 3.5 11.5 20l2.1-6.2L20 11.5 5 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      ) : null}
      {kind === 'rectangle' ? (
        <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      ) : null}
      {kind === 'ellipse' ? (
        <ellipse cx="12" cy="12" rx="8" ry="5.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      ) : null}
      {kind === 'diamond' ? (
        <path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      ) : null}
      {kind === 'text' ? (
        <path d="M5 6h14M12 6v12M8.5 18h7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      ) : null}
      {kind === 'connector' ? (
        <path d="M4 16.5 15.5 5M14 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </svg>
  )
}
