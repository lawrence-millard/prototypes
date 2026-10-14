import Link from "next/link"

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">Daily habits, the same on every device.</p>
      <div className="preview" aria-hidden="true">
        <div className="preview-row">
          <div className="preview-main">
            <div className="preview-title">Walk</div>
            <div className="dots">{dots("1111000")}</div>
          </div>
          <div className="preview-meta">4</div>
        </div>
        <div className="preview-row">
          <div className="preview-main">
            <div className="preview-title">Read</div>
            <div className="dots">{dots("0000100")}</div>
          </div>
          <div className="preview-meta">1</div>
        </div>
      </div>
      <Link className="primary" href="/sign-in">Sign in</Link>
    </section>
  )
}

function dots(pattern: string) {
  return pattern.split("").map((bit, index) => <span className={bit === "1" ? "dot on" : "dot"} key={index} />)
}
