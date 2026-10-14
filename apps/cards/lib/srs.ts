import type { Grade } from './types'

export type Srs = {
  ease: number
  intervalDays: number
  repetitions: number
  dueAt: Date
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function nextReview(state: { ease: number; intervalDays: number; repetitions: number }, grade: Grade, now: Date): Srs {
  let ease = state.ease
  let intervalDays = state.intervalDays
  let repetitions = state.repetitions
  if (grade === 'again') {
    return {
      ease: Math.max(1.3, round2(ease - 0.2)),
      intervalDays: 0,
      repetitions: 0,
      dueAt: new Date(now.getTime() + 10 * 60 * 1000),
    }
  }
  if (grade === 'good') {
    if (repetitions === 0) intervalDays = 1
    else if (repetitions === 1) intervalDays = 6
    else intervalDays = Math.min(36500, Math.max(1, Math.round(intervalDays * ease)))
    repetitions += 1
  } else {
    ease = Math.min(5, round2(ease + 0.15))
    if (repetitions === 0) intervalDays = 4
    else intervalDays = Math.min(36500, Math.max(1, Math.round(intervalDays * ease * 1.3)))
    repetitions += 1
  }
  return {
    ease: round2(ease),
    intervalDays,
    repetitions,
    dueAt: new Date(now.getTime() + intervalDays * 86400000),
  }
}
