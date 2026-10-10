import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { examCountdown, formatDuration, formatShortDate, greetingFor, resolveMockDate } from "@/lib/dates";
import { daysUntil } from "@/lib/dates";
import { homeData } from "@/lib/queries";
import { DynamicScreen, Screen } from "@/components/screen";

export const metadata = { title: "Your plan" };

const badges = {
  Weak: "bg-[#fde8ea] text-[#e35d6a]",
  Review: "bg-[#fff1dc] text-[#e39a32]",
  New: "bg-[#e5f7ee] text-[#3aaa6d]",
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
      <p className="text-[15px] text-mute">{greetingFor(user.displayName, now)}</p>
      <h1 className="mt-2 text-[32px] font-bold tracking-tight">Your plan for today</h1>
      <p className="mt-2 text-[15px] text-mute">
        {plan.tasks.length} task{plan.tasks.length === 1 ? "" : "s"} · about {plan.minutes} minutes
      </p>
      <section className="mt-5 rounded-[22px] bg-brand px-5 py-4 text-white">
        <p className="text-[15px]">{examCountdown(daysUntil(examDate, now))}</p>
        <p className="mt-1 text-[18px] font-semibold">
          🔥 {user.streak}-day streak · {user.xp.toLocaleString("en-GB")} XP
        </p>
      </section>
      <div className="mt-4 flex flex-col gap-3">
        {plan.tasks.map((task) => (
          <Link
            key={task.href}
            href={task.href}
            className="rounded-[22px] bg-white px-4 py-4 shadow-[0_8px_28px_rgba(40,32,80,0.05)]"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="text-[17px] font-semibold leading-6">{task.title}</span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${badges[task.label]}`}>
                {task.label}
              </span>
            </span>
            <span className="mt-1 block text-[14px] text-mute">{task.meta}</span>
          </Link>
        ))}
        <Link
          href={`/mock/${mock.id}`}
          className="rounded-[22px] bg-white px-4 py-4 shadow-[0_8px_28px_rgba(40,32,80,0.05)]"
        >
          <span className="block text-[17px] font-semibold leading-6">{mock.title}</span>
          <span className="mt-1 block text-[14px] text-mute">
            {formatShortDate(mockDate)} · {formatDuration(mock.minutes)} · {mock.marks} marks
          </span>
        </Link>
      </div>
      <nav className="mt-6 flex gap-4 text-[14px] font-semibold text-brand">
        <Link href="/progress">Your progress</Link>
        <Link href="/tutor">Ask Markwise</Link>
      </nav>
    </Screen>
  );
}
