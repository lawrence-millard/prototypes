export function Landing() {
  return (
    <div className="stack">
      <p className="lede">A link that opens once, then disappears.</p>
      <div className="preview" aria-hidden="true">
        <div className="preview-link">
          <span className="mono dim">/v/k7m2</span>
          <span className="keychip mono">#key</span>
        </div>
      </div>
      <a className="primary" href="/sign-in">Sign in</a>
    </div>
  )
}
