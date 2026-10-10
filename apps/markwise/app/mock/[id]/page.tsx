import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { formatDuration, formatShortDate, resolveMockDate } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { questions } from "@/lib/schema";
import { inArray } from "drizzle-orm";
import { POLITICS_MOCK } from "@/lib/subjects";
import { DynamicScreen, Screen } from "@/components/screen";

export const metadata = { title: "Mock" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DynamicScreen>
      <Mock params={params} />
    </DynamicScreen>
  );
}

async function Mock({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  await requirePageUser();
  const { id } = await params;
  if (id !== POLITICS_MOCK.id) notFound();
  const now = new Date();
  const db = await getDb();
  const rows = await db.select().from(questions).where(inArray(questions.id, [...POLITICS_MOCK.questionIds]));
  const ordered = POLITICS_MOCK.questionIds
    .map((questionId) => rows.find((row) => row.id === questionId))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <Screen
      footer={
        <Link
          href={`/practice/${ordered[0]?.id ?? ""}?mock=1`}
          className="flex h-[52px] w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white"
        >
          Start paper
        </Link>
      }
    >
      <p className="text-[14px] text-mute">Timed practice</p>
      <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">{POLITICS_MOCK.title}</h1>
      <p className="mt-3 text-[15px] text-mute">
        {formatShortDate(resolveMockDate(POLITICS_MOCK.anchorDate, now))} · {formatDuration(POLITICS_MOCK.minutes)} ·{" "}
        {POLITICS_MOCK.marks} marks
      </p>
      <p className="mt-4 text-[15px] leading-6 text-ink">
        Three original questions in the style of Paper 1: a source, a UK government essay, and a political ideas essay.
        This build does not lock the clock. Mark each answer when you are ready.
      </p>
      <ol className="mt-5 flex flex-col gap-3">
        {ordered.map((question, index) => (
          <li key={question.id} className="rounded-[22px] bg-white px-4 py-4">
            <p className="text-[13px] font-semibold text-mute">Question {index + 1}</p>
            <p className="mt-1 text-[16px] font-semibold">
              {question.commandWord} · {question.marks} marks
            </p>
          </li>
        ))}
      </ol>
    </Screen>
  );
}
