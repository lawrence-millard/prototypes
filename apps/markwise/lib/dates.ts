export function londonDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function londonHour(now: Date) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now),
  );
}

export function daysUntil(examDate: string, now: Date) {
  const today = Date.parse(`${londonDate(now)}T00:00:00Z`);
  const exam = Date.parse(`${examDate}T00:00:00Z`);
  return Math.round((exam - today) / 86_400_000);
}

export function examCountdown(days: number) {
  if (days > 1) return `A Level exams start in ${days} days`;
  if (days === 1) return "A Level exams start tomorrow";
  if (days === 0) return "A Level exams start today";
  return "Your exam date has passed";
}

export function greetingFor(name: string, now: Date) {
  const hour = londonHour(now);
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const trimmed = name.trim();
  return trimmed ? `Good ${part}, ${trimmed}` : `Good ${part}`;
}

export function shiftIsoDate(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nextStreak(streak: number, lastActiveOn: string | null, today: string) {
  if (lastActiveOn === today) return streak;
  if (lastActiveOn && shiftIsoDate(lastActiveOn, 1) === today) return streak + 1;
  return 1;
}

export function formatShortDate(iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")}`;
}

export function resolveMockDate(anchor: string, now: Date) {
  const today = londonDate(now);
  if (today <= anchor) return anchor;
  const date = new Date(`${today}T12:00:00Z`);
  const day = date.getUTCDay();
  const add = (6 - day + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + add);
  return date.toISOString().slice(0, 10);
}

export function formatDuration(minutes: number) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${minutes} minutes`;
}

export function aboutMinutes(minutes: number) {
  return Math.max(5, Math.round(minutes / 5) * 5);
}
