export function Landing() {
  return (
    <div className="stack">
      <p className="lede">Decks that come back when they are due.</p>
      <div className="preview" aria-hidden="true">
        <div className="mini-stage">
          <div className="mini-card behind" />
          <div className="mini-card front">
            <span>ser</span>
            <span className="dim">to be</span>
          </div>
        </div>
      </div>
      <a className="primary" href="/sign-in">Sign in</a>
    </div>
  )
}
