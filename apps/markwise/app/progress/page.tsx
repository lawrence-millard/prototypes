import Link from "next/link";
import { connection } from "next/server";
import { requirePageUser } from "@/lib/auth";
import { masteryTone, percent } from "@/lib/grades";
import { progressForUser } from "@/lib/queries";
import { SUBJECTS } from "@/lib/subjects";
import { DynamicScreen, Screen } from "@/components/screen";

export const metadata = { title: "Your progress" };

const bar = {
  bad: "bg-bad",
  mid: "bg-mid",
  good: "bg-good",
};

export default function Page() {
  return (
    <DynamicScreen>
      <Progress />
    </DynamicScreen>
  );
}

async function Progress() {
  await connection();
  const user = await requirePageUser();
  const progress = await progressForUser(user.id);

  return (
    <Screen
      footer={
        progress.focus ? (
          <Link
            href={progress.focus.href}
            className="flex h-[52px] w-full items-center justify-center rounded-full bg-brand px-4 text-center text-[16px] font-semibold text-white"
          >
            {progress.focus.label}
          </Link>
        ) : null
      }
    >
      <h1 className="text-[32px] font-bold tracking-tight">Your progress</h1>
      <p className="mt-2 text-[15px] text-mute">Predicted vs target A Level grades</p>
      <section className="mt-5 rounded-[22px] bg-white px-4 py-4 shadow-[0_8px_28px_rgba(40,32,80,0.05)]">
        <div className="flex flex-col gap-3">
          {progress.grades.map((grade) => (
            <p key={grade.subject} className="flex items-center justify-between text-[16px]">
              <span>{grade.label}</span>
              <span className="font-semibold">
                {grade.predicted} → target {grade.target}
              </span>
            </p>
          ))}
        </div>
      </section>
      <section className="mt-3 rounded-[22px] bg-white px-4 py-4 shadow-[0_8px_28px_rgba(40,32,80,0.05)]">
        <h2 className="text-[14px] text-mute">Weakest topics</h2>
        {progress.weakest.length === 0 ? (
          <p className="mt-3 text-[15px] leading-6">Practise a topic and your mastery will show up here.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {progress.weakest.map((topic) => {
              const tone = masteryTone(topic.pKnown);
              const value = percent(topic.pKnown);
              return (
                <div key={topic.id}>
                  <p className="flex items-baseline justify-between gap-3 text-[15px]">
                    <span>
                      <span className="text-mute">{SUBJECTS[topic.subject].label} · </span>
                      <span className="font-medium">{topic.name}</span>
                    </span>
                    <span className="font-semibold">{value}%</span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={value} aria-valuemax={100}>
                    <div className={`h-full rounded-full ${bar[tone]}`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Screen>
  );
}
