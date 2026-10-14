"use client"

import { useOptimistic, useState, useTransition } from "react"
import { deleteHabitAction, renameHabitAction, toggleHabitAction } from "@/lib/actions"
import { applyToggle, streak, week } from "@/lib/dates"
import type { Habit } from "@/lib/data"

const errors: Record<string, string> = {
  invalid: "invalid",
  rate: "slow down",
  unavailable: "unavailable",
  missing: "missing",
  limit: "full",
}

export function HabitList({ habits, today }: { habits: Habit[]; today: string }) {
  const [problem, setProblem] = useState("")
  const [optimistic, update] = useOptimistic(habits, reduce)
  const [, start] = useTransition()
  const days = week(today)

  function toggle(habit: Habit) {
    const on = !habit.days.includes(today)
    start(async () => {
      update({ type: "toggle", id: habit.id, on, today })
      const result = await toggleHabitAction(habit.id, on ? "1" : "0", today)
      setProblem(result?.error ? errors[result.error] ?? "unavailable" : "")
    })
  }

  function remove(id: string) {
    start(async () => {
      update({ type: "delete", id })
      const result = await deleteHabitAction(id)
      setProblem(result?.error ? errors[result.error] ?? "unavailable" : "")
    })
  }

  return (
    <section className="list">
      {problem ? <p className="alert" role="alert">{problem}</p> : null}
      {optimistic.map((habit) => {
        const have = new Set(habit.days)
        return (
          <article className="item" key={habit.id}>
            <h2>{habit.name}</h2>
            <p className="streak"><span className="label">streak</span><span className="count">{streak(habit.days, today)}</span></p>
            <div className="week">
              {days.map((day) => (
                <div className="day" key={day.day}>
                  <span className="label">{day.label}</span>
                  {day.today ? (
                    <button
                      type="button"
                      className={have.has(day.day) ? "cell on today" : "cell today"}
                      aria-pressed={have.has(day.day)}
                      aria-label={`${habit.name} ${today}`}
                      onClick={() => toggle(habit)}
                    />
                  ) : (
                    <span className={have.has(day.day) ? "cell on" : "cell"} />
                  )}
                </div>
              ))}
            </div>
            <div className="actions">
              <details>
                <summary>edit</summary>
                <Rename id={habit.id} name={habit.name} onDone={(name) => {
                  start(async () => {
                    update({ type: "rename", id: habit.id, name })
                    const result = await renameHabitAction(habit.id, name)
                    setProblem(result?.error ? errors[result.error] ?? "unavailable" : "")
                  })
                }} />
              </details>
              <details>
                <summary>delete</summary>
                <button type="button" className="ghost" onClick={() => remove(habit.id)}>confirm</button>
              </details>
            </div>
          </article>
        )
      })}
    </section>
  )
}

function reduce(current: Habit[], action: { type: "toggle"; id: string; on: boolean; today: string } | { type: "delete"; id: string } | { type: "rename"; id: string; name: string }) {
  if (action.type === "delete") return current.filter((habit) => habit.id !== action.id)
  if (action.type === "rename") return current.map((habit) => habit.id === action.id ? { ...habit, name: action.name } : habit)
  return current.map((habit) => habit.id === action.id ? { ...habit, days: applyToggle(habit.days, action.today, action.on) } : habit)
}

function Rename({ id, name, onDone }: { id: string; name: string; onDone: (name: string) => void }) {
  const [value, setValue] = useState(name)
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault()
        onDone(value)
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label className="field">
        <span className="label">habit</span>
        <input name="name" type="text" required maxLength={40} value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" />
      </label>
      <button className="primary" type="submit">save</button>
    </form>
  )
}
