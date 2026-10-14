import { Editor } from "@/components/editor"
import { Header } from "@/components/header"
import { Landing } from "@/components/landing"
import { Shortcuts } from "@/components/shortcuts"
import { createNoteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import type { Note } from "@/lib/data"
import { readNotes } from "@/lib/reads"
import { relativeTime } from "@/lib/relative"

const errors: Record<string, string> = {
  invalid: "Invalid",
  rate: "Slow down",
  unavailable: "Unavailable",
  missing: "Missing",
  limit: "Full",
}

export default async function Home({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  const userId = await currentUserId()
  if (!userId) {
    return (
      <main className="frame">
        <Header name="notes" mark="n" signedIn={false} />
        <Landing />
      </main>
    )
  }
  let notes: Note[] = []
  let problem = false
  try {
    notes = await readNotes(userId)
  } catch {
    problem = true
  }
  const notice = e && errors[e] ? errors[e] : ""
  const now = Date.now()
  return (
    <main className="frame">
      <Header name="notes" mark="n" signedIn />
      <Editor action={createNoteAction} title="" body="" errors={errors} hint="New note" />
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">Unavailable</p> : null}
      {!problem && notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 3.5h9v9h-9v-9Z" stroke="currentColor" strokeWidth="1.4" /></svg>
          </div>
          <p>No notes yet</p>
        </div>
      ) : null}
      {notes.length > 0 ? (
        <section className="list">
          {notes.map((note) => (
            <article className="item" key={note.id}>
              <div className="row">
                <a className="item-link" href={`/n/${note.id}`}>{note.title}</a>
                <time className="time" dateTime={note.updatedAt}>{relativeTime(note.updatedAt, now)}</time>
              </div>
            </article>
          ))}
        </section>
      ) : null}
      <Shortcuts rows={[["N", "New note"], ["?", "Shortcuts"], ["Esc", "Close"]]} />
    </main>
  )
}
