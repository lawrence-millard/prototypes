import { ActionForm } from "@/components/action-form"
import { HabitList } from "@/components/habit-list"
import { Header } from "@/components/header"
import { createHabitAction } from "@/lib/actions"
import { currentUserId } from "@/lib/auth"
import { utcToday } from "@/lib/dates"
import type { Habit } from "@/lib/data"
import { readHabits } from "@/lib/reads"

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
  let habits: Habit[] = []
  let problem = false
  if (userId) {
    try {
      habits = await readHabits(userId)
    } catch {
      problem = true
    }
  }
  const notice = e && errors[e] ? errors[e] : ""
  return (
    <main className="frame">
      <Header name="habits" mark="h" signedIn={Boolean(userId)} />
      <ActionForm action={createHabitAction} submit="add" errors={errors}>
        <label className="field">
          <span className="label">habit</span>
          <input name="name" type="text" required maxLength={40} autoComplete="off" />
        </label>
      </ActionForm>
      {notice ? <p className="alert" role="alert">{notice}</p> : null}
      {problem ? <p className="alert" role="alert">unavailable</p> : null}
      {!problem && habits.length === 0 ? <p className="empty">no habits</p> : null}
      {habits.length > 0 ? <HabitList habits={habits} today={utcToday()} /> : null}
    </main>
  )
}
