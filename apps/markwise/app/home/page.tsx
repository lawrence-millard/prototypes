import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { examCountdown, formatDuration, formatShortDate, greetingFor, resolveMockDate } from "@/lib/dates";
import { daysUntil } from "@/lib/dates";
import { homeData } from "@/lib/queries";
import { DynamicScreen, Screen } from "@/components/screen";

export const metadata = { title: "Today" };

const badges = {
  Weak: "bg-surface text-ink",
  Review: "bg-surface text-mute",
  New: "bg-surface text-ink",
};

export default function Page() {
  return (
    <DynamicScreen>
      <Home />
    </DynamicScreen>
  );
}

async function Home() {
  await connection();
  const user = await requirePageUser();
  if (!user.onboarded) redirect("/onboarding");
  const now = new Date();
  const { plan, mock } = await homeData(user.id);
  const examDate = user.examDate ?? "2027-05-14";
  const mockDate = resolveMockDate(mock.anchorDate, now);

  return (
    <Screen>
      <p className="label">Today</p>
      <h1 className="mt-2 text-[26px] tracking-tight">{greetingFor(user.displayName, now)}</h1>
      <p className="mt-2 text-[14px] text-mute">
        {examCountdown(daysUntil(examDate, now))} · {plan.minutes} min
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {plan.tasks.map((task) => (
          <Link
            key={task.href}
            href={task.href}
            className="rounded-[10px] border border-line bg-surface px-4 py-4"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-[17px] font-medium leading-6">{task.title}</span>
              <span className={`shrink-0 rounded-[8px] px-3 py-1 text-[13px] font-medium ${badges[task.label]}`}>
                {task.label}
              </span>
            </span>
            <span className="mt-1 block text-[14px] text-mute">{task.meta}</span>
          </Link>
        ))}
        <Link
          href={`/mock/${mock.id}`}
          className="rounded-[10px] border border-line bg-surface px-4 py-4"
        >
          <span className="block text-[17px] font-medium leading-6">{mock.title}</span>
          <span className="mt-1 block text-[14px] text-mute">
            {formatShortDate(mockDate)} · {formatDuration(mock.minutes)} · {mock.marks} marks
          </span>
        </Link>
      </div>
      <nav className="mt-6 flex gap-4 text-[14px]">
        <Link href="/progress">Progress</Link>
        <Link href="/tutor">Tutor</Link>
      </nav>
    </Screen>
  );
}
