import { Editor } from "@/components/editor"
import { Header } from "@/components/header"
import { createNoteAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import type { Note } from "@/lib/data"
import { readNotes } from "@/lib/reads"

const errors: Record<string, string> = {
  invalid: "invalid",
  rate: "slow down",
  unavailable: "unavailable",
  missing: "missing",
  limit: "full",
}

export default async function Home({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  const userId = await currentUserId()
  let notes: Note[] = []
  let problem = false
  if (userId) {
    try {
      notes = await readNotes(userId)
    } catch {
      problem = true
    }
  }
  const notice = e && errors[e] ? errors[e] : ""
  return (
    <main className="frame">
      <Header name="notes" mark="n" signedIn={Boolean(userId)} />
      <Editor action={createNoteAction} title="" body="" errors={errors} />
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">unavailable</p> : null}
      {!problem && notes.length === 0 ? <p className="empty">no notes</p> : null}
      {notes.length > 0 ? (
        <section className="list">
          {notes.map((note) => (
            <article className="item" key={note.id}>
              <a className="item-link" href={`/n/${note.id}`}>{note.title}</a>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
