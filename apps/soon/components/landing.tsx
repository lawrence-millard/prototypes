export function Landing() {
  return (
    <div className="stack">
      <p className="lede">A date, a countdown, a page you can send.</p>
      <div className="preview" aria-hidden="true">
        <div className="preview-count">
          <p className="time mono">12d</p>
          <p className="dim">Launch</p>
        </div>
      </div>
      <a className="primary" href="/sign-in">Sign in</a>
    </div>
  )
}
