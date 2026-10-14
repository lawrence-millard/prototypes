import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { quizForUser } from "@/lib/queries";
import { SUBJECTS } from "@/lib/subjects";
import { DynamicScreen, Screen } from "@/components/screen";

export const metadata = { title: "Quiz" };

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <DynamicScreen>
      <Quiz params={params} />
    </DynamicScreen>
  );
}

async function Quiz({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const user = await requirePageUser();
  const { slug } = await params;
  const quiz = await quizForUser(user.id, slug);
  if (!quiz) notFound();
  const fill = Math.round((quiz.answered / quiz.total) * 100);

  return (
    <Screen>
      <p className="text-[14px] text-mute">{quiz.breadcrumb}</p>
      <h1 className="mt-2 text-[28px] font-medium tracking-tight">{quiz.title}</h1>
      <p className="mt-2 text-[15px] text-mute">
        {SUBJECTS[quiz.subject].label} · {quiz.answered} of {quiz.total} answered · {quiz.score}/{quiz.total}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-[8px] bg-line">
        <div className="h-full rounded-[8px] bg-brand" style={{ width: `${fill}%` }} />
      </div>
      {quiz.done || !quiz.next ? (
        <section className="mt-5 rounded-[10px] border border-line bg-surface p-4">
          <p className="text-[18px] font-medium">
            {quiz.score}/{quiz.total}
          </p>
          <Link href="/progress" className="mt-4 inline-block text-[15px]">
            Progress
          </Link>
        </section>
      ) : (
        <form action="/api/mark" method="post" className="mt-5 flex flex-col gap-3">
          <input type="hidden" name="questionId" value={quiz.next.id} />
          <input type="hidden" name="next" value={`/practice/quiz/${slug}`} />
          <article className="rounded-[10px] border border-line bg-surface p-4">
            <p className="text-[13px] font-medium text-brand">Question {quiz.answered + 1}</p>
            <p className="mt-2 text-[16px] leading-7">{quiz.next.stem}</p>
          </article>
          {quiz.next.choices?.map((choice) => (
            <button
              key={choice.id}
              type="submit"
              name="choice"
              value={choice.id}
              className="rounded-[8px] border border-line bg-surface px-4 py-4 text-left text-[15px] leading-6"
            >
              {choice.text}
            </button>
          ))}
        </form>
      )}
    </Screen>
  );
}
