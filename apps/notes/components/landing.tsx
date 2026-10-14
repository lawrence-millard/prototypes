import Link from "next/link"

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">Markdown notes on every device.</p>
      <div className="preview" aria-hidden="true">
        <div className="preview-row">
          <NoteMark />
          <div className="preview-main">
            <div className="preview-title">Launch checklist</div>
            <div className="preview-sub">Three items left for Friday.</div>
          </div>
          <div className="preview-meta">2h</div>
        </div>
        <div className="preview-row">
          <NoteMark />
          <div className="preview-main">
            <div className="preview-title">API draft</div>
            <div className="preview-sub">Endpoints and error cases.</div>
          </div>
          <div className="preview-meta">1d</div>
        </div>
      </div>
      <Link className="primary" href="/sign-in">Sign in</Link>
    </section>
  )
}

function NoteMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 3.5h9v9h-9v-9Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 6.5h5M5.5 9h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
