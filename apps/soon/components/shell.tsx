import { ThemeToggle } from './theme-toggle'

export function Shell({
  mark,
  name,
  menu,
  children,
}: {
  mark: string
  name: string
  menu?: React.ReactNode | null
  children: React.ReactNode
}) {
  return (
    <main className="frame">
      <div className="col">
        <header className="top">
          <a className="brand" href="/">
            <span className="mark" aria-hidden="true">{mark}</span>
            <h1 className="name">{name}</h1>
          </a>
          <div className="top-actions">
            {menu === undefined ? <a className="primary" href="/sign-in">Sign in</a> : menu}
          </div>
        </header>
        {children}
      </div>
      <ThemeToggle />
    </main>
  )
}
