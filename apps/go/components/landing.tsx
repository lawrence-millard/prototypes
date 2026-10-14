import Link from "next/link"

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">Short links that stay with your account.</p>
      <div className="preview" aria-hidden="true">
        <div className="preview-row">
          <LinkMark />
          <div className="preview-main">
            <div className="preview-title code">docs</div>
            <div className="preview-sub">example.com/docs</div>
          </div>
          <div className="preview-meta">2h</div>
        </div>
        <div className="preview-row">
          <LinkMark />
          <div className="preview-main">
            <div className="preview-title code">notes</div>
            <div className="preview-sub">example.com/notes</div>
          </div>
          <div className="preview-meta">1d</div>
        </div>
      </div>
      <Link className="primary" href="/sign-in">Sign in</Link>
    </section>
  )
}

function LinkMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6.5 9.5 9.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7 4.5 8.2 3.3a2.6 2.6 0 0 1 3.7 3.7L10.6 8.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 11.5 7.8 12.7a2.6 2.6 0 0 1-3.7-3.7L5.4 7.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
