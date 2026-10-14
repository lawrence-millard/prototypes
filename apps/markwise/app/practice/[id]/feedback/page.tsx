import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { scoreTone } from "@/lib/grades";
import { feedbackForUser } from "@/lib/queries";
import { SUBJECTS } from "@/lib/subjects";
import { DynamicScreen, Screen } from "@/components/screen";
import { FlagButton } from "@/components/flag-button";
import type { MarkResult } from "@/lib/types";

export const metadata = { title: "Feedback" };

const scoreClass = {
  bad: "text-bad",
  mid: "text-mid",
  good: "text-good",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DynamicScreen>
      <Feedback params={params} />
    </DynamicScreen>
  );
}

async function Feedback({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const user = await requirePageUser();
  const { id } = await params;
  const page = await feedbackForUser(user.id, id);
  if (!page || !page.attempt) notFound();
  const result = page.attempt.feedback;
  const scheme = SUBJECTS[page.subject].scheme;
  const tone = scoreTone(result.total, result.marks);

  return (
    <Screen
      footer={
        <div className="flex gap-3">
          <Link
            href={`/tutor?attempt=${page.attempt.id}`}
            className="flex h-[52px] flex-1 items-center justify-center rounded-[8px] border border-line bg-surface text-[16px] font-medium"
          >
            Tutor
          </Link>
          <Link
            href={`/practice/${id}`}
            className="flex h-[52px] flex-[1.15] items-center justify-center rounded-[8px] bg-brand text-[16px] font-medium text-on-brand"
          >
            Rewrite
          </Link>
        </div>
      }
    >
      <p className="label">{scheme}</p>
      <section className="mt-4 rounded-[10px] border border-line bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-[40px] font-medium leading-none ${scoreClass[tone]}`}>
            {result.total} <span className="text-[28px] font-medium text-mute">/ {result.marks}</span>
          </p>
          {result.mode === "levels" ? (
            <span className="rounded-[8px] border border-line bg-surface px-3 py-1 text-[13px] font-medium text-mute">
              Level {result.level} of {result.maxLevel}
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-[15px] leading-6">{result.summary}</p>
        <FlagButton attemptId={page.attempt.id} flagged={page.attempt.flagged} />
      </section>
      {result.ao.length > 0 ? <AoCard result={result} /> : null}
      <section className="mt-3 rounded-[10px] bg-tip p-4">
        <p className="text-[15px] font-medium text-tip-title">
          {result.mode === "levels" && result.level < result.maxLevel ? `To reach Level ${result.level + 1}` : "Next step"}
        </p>
        <p className="mt-2 text-[15px] leading-6 text-ink">{result.nextLevelTip}</p>
      </section>
    </Screen>
  );
}

function AoCard({ result }: { result: MarkResult }) {
  return (
    <section className="mt-3 rounded-[10px] border border-line bg-surface p-4">
      <h2 className="text-[16px] font-medium">{result.mode === "levels" ? "Assessment objectives" : "Points"}</h2>
      <div className="mt-4 flex flex-col gap-4">
        {result.ao.map((row) => {
          const ratio = row.max === 0 ? 0 : row.awarded / row.max;
          const color = ratio < 0.5 ? "bg-bad" : "bg-good";
          const text = ratio < 0.5 ? "text-bad" : "text-good";
          return (
            <div key={row.code}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">
                  {row.code} {row.name}
                </p>
                <p className={`font-medium ${text}`}>
                  {row.awarded}/{row.max}
                </p>
              </div>
              <p className="mt-1 text-[14px] text-mute">{row.comment}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-[8px] bg-line" role="progressbar" aria-valuenow={row.awarded} aria-valuemax={row.max}>
                <div className={`h-full rounded-[8px] ${color}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
