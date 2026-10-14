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
          className="flex h-[52px] w-full items-center justify-center rounded-[8px] bg-brand text-[16px] font-medium text-on-brand"
        >
          Start paper
        </Link>
      }
    >
      <p className="label">Mock</p>
      <h1 className="mt-2 text-[26px] tracking-tight">{POLITICS_MOCK.title}</h1>
      <p className="mt-3 text-[14px] text-mute">
        {formatShortDate(resolveMockDate(POLITICS_MOCK.anchorDate, now))} · {formatDuration(POLITICS_MOCK.minutes)} ·{" "}
        {POLITICS_MOCK.marks} marks
      </p>
      <ol className="mt-5 flex flex-col gap-3">
        {ordered.map((question, index) => (
          <li key={question.id} className="rounded-[10px] border border-line bg-surface px-4 py-4">
            <p className="text-[13px] font-medium text-mute">Question {index + 1}</p>
            <p className="mt-1 text-[16px] font-medium">
              {question.commandWord} · {question.marks} marks
            </p>
          </li>
        ))}
      </ol>
    </Screen>
  );
}
