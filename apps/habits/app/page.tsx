import { ActionForm, Submit } from "@/components/action-form"
import { HabitList } from "@/components/habit-list"
import { Header } from "@/components/header"
import { Landing } from "@/components/landing"
import { Shortcuts } from "@/components/shortcuts"
import { createHabitAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import { utcToday } from "@/lib/dates"
import type { Habit } from "@/lib/data"
import { readHabits } from "@/lib/reads"

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
        <Header name="habits" mark="h" signedIn={false} />
        <Landing />
      </main>
    )
  }
  let habits: Habit[] = []
  let problem = false
  try {
    habits = await readHabits(userId)
  } catch {
    problem = true
  }
  const notice = e && errors[e] ? errors[e] : ""
  return (
    <main className="frame">
      <Header name="habits" mark="h" signedIn />
      <ActionForm action={createHabitAction} className="composer" composer errors={errors}>
        <div className="composer-top">
          <label className="field-label" htmlFor="habit">Habit</label>
          <span className="hint"><kbd>N</kbd> New habit</span>
        </div>
        <div className="bar-input">
          <input id="habit" name="name" type="text" required maxLength={40} autoComplete="off" placeholder="Walk" />
          <Submit label="Add" />
        </div>
      </ActionForm>
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">Unavailable</p> : null}
      {!problem && habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.2 6.2 11 12.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p>No habits yet</p>
        </div>
      ) : null}
      {habits.length > 0 ? <HabitList habits={habits} today={utcToday()} /> : null}
      <Shortcuts rows={[["N", "New habit"], ["?", "Shortcuts"], ["Esc", "Close"]]} />
    </main>
  )
}
