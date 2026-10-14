import type { ReactNode } from 'react'

export function SignedOutLanding({ auth }: { auth: ReactNode }) {
  return (
    <main className="landing">
      <section className="landing-copy">
        <div className="brand">
          <Mark />
          <span className="brand-name">Sketchpad</span>
        </div>
        <h1>Draw a board. Keep it.</h1>
        <p className="lede">
          Shapes and arrows stay in this browser, then sync to your account when you are signed in.
        </p>
        <Preview />
      </section>
      <section className="landing-auth">{auth}</section>
    </main>
  )
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 38 38" aria-hidden="true">
      <rect x="0.5" y="0.5" width="37" height="37" rx="8" fill="rgb(var(--c-bg))" stroke="rgb(var(--c-fg))" />
      <rect x="8" y="14" width="14" height="10" rx="2" fill="none" stroke="rgb(var(--c-fg))" strokeWidth="1.5" />
      <circle cx="26" cy="16" r="4" fill="none" stroke="rgb(var(--c-fg))" strokeWidth="1.5" />
    </svg>
  )
}

function Preview() {
  return (
    <figure className="preview">
      <svg viewBox="0 0 420 220" role="img" aria-label="Preview of a board with three connected shapes">
        <rect width="420" height="220" rx="10" fill="#f6f6f6" />
        <line x1="118" y1="78" x2="188" y2="78" stroke="#0b0b0b" strokeWidth="1.5" />
        <line x1="292" y1="96" x2="248" y2="132" stroke="#0b0b0b" strokeWidth="1.5" />
        <polygon points="292,96 286,100 292,104" fill="#0b0b0b" />
        <rect x="36" y="48" width="82" height="60" rx="8" fill="#e6e6e6" stroke="#0b0b0b" strokeWidth="1.5" />
        <text x="54" y="82" fill="#0b0b0b" fontSize="14" fontFamily="Open Runde, sans-serif">
          Start
        </text>
        <ellipse cx="240" cy="78" rx="52" ry="32" fill="#f6f6f6" stroke="#0b0b0b" strokeWidth="1.5" />
        <text x="222" y="83" fill="#0b0b0b" fontSize="14" fontFamily="Open Runde, sans-serif">
          End
        </text>
        <polygon points="210,150 258,178 210,206 162,178" fill="#cfcfcf" stroke="#0b0b0b" strokeWidth="1.5" />
        <text x="186" y="182" fill="#0b0b0b" fontSize="13" fontFamily="Open Runde, sans-serif">
          Choose
        </text>
      </svg>
      <figcaption className="label">Board</figcaption>
    </figure>
  )
}
