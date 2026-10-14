import { ThemeToggle } from './theme-toggle'

export function Shell({
  mark,
  name,
  children,
}: {
  mark: string
  name: string
  children: React.ReactNode
}) {
  return (
    <main className="frame">
      <div className="col">
        <header className="head">
          <div className="mark" aria-hidden="true">{mark}</div>
          <h1 className="name">{name}</h1>
        </header>
        {children}
      </div>
      <ThemeToggle />
    </main>
  )
}
