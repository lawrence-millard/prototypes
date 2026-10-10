const BANDS = [
  { grade: "A*", min: 0.9 },
  { grade: "A", min: 0.8 },
  { grade: "B", min: 0.7 },
  { grade: "C", min: 0.6 },
  { grade: "D", min: 0.5 },
  { grade: "E", min: 0.4 },
] as const;

export function predictGrade(values: number[]) {
  if (values.length === 0) return "—";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  for (const band of BANDS) {
    if (average >= band.min) return band.grade;
  }
  return "U";
}

export function masteryTone(pKnown: number): "bad" | "mid" | "good" {
  if (pKnown < 0.5) return "bad";
  if (pKnown < 0.7) return "mid";
  return "good";
}

export function scoreTone(total: number, marks: number): "bad" | "mid" | "good" {
  if (marks <= 0) return "mid";
  const ratio = total / marks;
  if (ratio < 0.5) return "bad";
  if (ratio < 0.8) return "mid";
  return "good";
}

export function percent(pKnown: number) {
  return Math.round(pKnown * 100);
}
