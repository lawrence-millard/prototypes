"use client"

import { Check, Pencil, Trash2 } from "lucide-react"
import { useOptimistic, useState, useTransition } from "react"
import { deleteHabitAction, renameHabitAction, toggleHabitAction } from "@/lib/actions"
import { applyToggle, streak, week } from "@/lib/dates"
import type { Habit } from "@/lib/data"
import { relativeTime } from "@/lib/relative"

const errors: Record<string, string> = {
  invalid: "Invalid",
  rate: "Slow down",
  unavailable: "Unavailable",
  missing: "Missing",
  limit: "Full",
}

export function HabitList({ habits, today }: { habits: Habit[]; today: string }) {
  const [problem, setProblem] = useState("")
  const [optimistic, update] = useOptimistic(habits, reduce)
  const [, start] = useTransition()
  const days = week(today)
  const now = Date.now()

  function toggle(habit: Habit) {
    const on = !habit.days.includes(today)
    start(async () => {
      update({ type: "toggle", id: habit.id, on, today })
      const result = await toggleHabitAction(habit.id, on ? "1" : "0", today)
      setProblem(result?.error ? errors[result.error] ?? "Unavailable" : "")
    })
  }

  function remove(id: string) {
    start(async () => {
      update({ type: "delete", id })
      const result = await deleteHabitAction(id)
      setProblem(result?.error ? errors[result.error] ?? "Unavailable" : "")
    })
  }

  return (
    <section className="list">
      {problem ? <p className="alert" role="alert">{problem}</p> : null}
      {optimistic.map((habit) => {
        const have = new Set(habit.days)
        const count = streak(habit.days, today)
        return (
          <article className="item" key={habit.id}>
            <div className="row">
              <h2>{habit.name}</h2>
              {habit.createdAt ? <time className="time" dateTime={habit.createdAt}>{relativeTime(habit.createdAt, now)}</time> : null}
            </div>
            <p className="streak">{count === 1 ? "1 day streak" : `${count} day streak`}</p>
            <div className="week">
              {days.map((day) => (
                <div className="day" key={day.day}>
                  <span className="dow">{day.label}</span>
                  {day.today ? (
                    <button
                      type="button"
                      className={have.has(day.day) ? "cell on today" : "cell today"}
                      aria-pressed={have.has(day.day)}
                      aria-label={`${habit.name} ${today}`}
                      onClick={() => toggle(habit)}
                    >
                      {have.has(day.day) ? <Check size={14} strokeWidth={1.75} /> : null}
                    </button>
                  ) : (
                    <span className={have.has(day.day) ? "cell on" : "cell"}>
                      {have.has(day.day) ? <Check size={14} strokeWidth={1.75} /> : null}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="meta">
              <span />
              <div className="actions">
                <details>
                  <summary className="icon-btn" aria-label="Edit"><Pencil size={16} strokeWidth={1.5} /></summary>
                  <Rename id={habit.id} name={habit.name} onDone={(name) => {
                    start(async () => {
                      update({ type: "rename", id: habit.id, name })
                      const result = await renameHabitAction(habit.id, name)
                      setProblem(result?.error ? errors[result.error] ?? "Unavailable" : "")
                    })
                  }} />
                </details>
                <details>
                  <summary className="icon-btn" aria-label="Delete"><Trash2 size={16} strokeWidth={1.5} /></summary>
                  <div className="pop-body">
                    <p className="dim">Delete this habit?</p>
                    <button type="button" className="ghost" onClick={() => remove(habit.id)}>Delete</button>
                  </div>
                </details>
              </div>
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
      className="pop-body"
      onSubmit={(event) => {
        event.preventDefault()
        onDone(value)
      }}
    >
      <input type="hidden" name="id" value={id} />
      <label className="field-label" htmlFor={`name-${id}`}>Name</label>
      <div className="bar-input">
        <input id={`name-${id}`} name="name" type="text" required maxLength={40} value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" placeholder="Walk" />
        <button className="primary" type="submit">Save</button>
      </div>
    </form>
  )
}
