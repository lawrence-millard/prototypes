export const DAILY_MARK_CAP = 25;
export const DAILY_TUTOR_CAP = 50;

export function canSpend(usage: { marks: number; tutorTurns: number }, kind: "mark" | "tutor") {
  if (kind === "mark") return usage.marks < DAILY_MARK_CAP;
  return usage.tutorTurns < DAILY_TUTOR_CAP;
}

export function capMessage(kind: "mark" | "tutor") {
  if (kind === "mark") {
    return `You've used today's ${DAILY_MARK_CAP} AI marks. They reset at midnight UK time. Saved feedback is still here.`;
  }
  return `You've used today's ${DAILY_TUTOR_CAP} tutor replies. They reset at midnight UK time.`;
}
