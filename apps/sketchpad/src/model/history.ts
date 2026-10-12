import { HISTORY_LIMIT } from './constants'

export interface History<T> {
  past: T[]
  present: T
  future: T[]
}

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] }
}

export function commitHistory<T>(history: History<T>, next: T): History<T> {
  if (Object.is(history.present, next)) return history
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  }
}

export function replacePresent<T>(history: History<T>, next: T): History<T> {
  if (Object.is(history.present, next)) return history
  return { past: history.past, present: next, future: history.future }
}

export function undoHistory<T>(history: History<T>): History<T> {
  const previous = history.past[history.past.length - 1]
  if (previous === undefined) return history
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redoHistory<T>(history: History<T>): History<T> {
  const [next, ...future] = history.future
  if (next === undefined) return history
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future,
  }
}

/** Finish a drag or text edit that previewed on top of `origin`. */
export function commitFromOrigin<T>(history: History<T>, origin: T): History<T> {
  if (Object.is(history.present, origin)) return history
  return {
    past: [...history.past, origin].slice(-HISTORY_LIMIT),
    present: history.present,
    future: [],
  }
}
