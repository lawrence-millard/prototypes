export const BKT = {
  pT: 0.12,
  pG: 0.2,
  pS: 0.1,
};

export function bktUpdate(pKnown: number, correct: boolean) {
  const p = clamp(pKnown, 0.01, 0.99);
  const { pT, pG, pS } = BKT;
  const posterior = correct
    ? (p * (1 - pS)) / (p * (1 - pS) + (1 - p) * pG)
    : (p * pS) / (p * pS + (1 - p) * (1 - pG));
  return clamp(posterior + (1 - posterior) * pT, 0.01, 0.99);
}

export function passedAttempt(total: number, marks: number) {
  if (marks <= 0) return false;
  return total / marks >= 0.6;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function xpForAttempt(total: number, marks: number) {
  if (marks <= 0) return 10;
  return 10 + Math.round((total / marks) * 40);
}
