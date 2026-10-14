import Link from "next/link"

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">Text that expires, kept with your account.</p>
      <div className="preview" aria-hidden="true">
        <div className="preview-row">
          <PageMark />
          <div className="preview-main">
            <div className="preview-title">Friday notes</div>
            <div className="preview-sub">Ship the draft before noon.</div>
          </div>
          <div className="preview-meta">6d</div>
        </div>
        <div className="preview-row">
          <PageMark />
          <div className="preview-main">
            <div className="preview-title">API draft</div>
            <div className="preview-sub">Routes, errors, and limits.</div>
          </div>
          <div className="preview-meta">2h</div>
        </div>
      </div>
      <Link className="primary" href="/sign-in">Sign in</Link>
    </section>
  )
}

function PageMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 2.5h5l3 3v8h-8v-11Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 2.5v3h3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
