import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { quizForUser } from "@/lib/queries";
import { SUBJECTS } from "@/lib/subjects";
import { DynamicScreen, Screen } from "@/components/screen";

export const metadata = { title: "Quick quiz" };

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
      <h1 className="mt-2 text-[28px] font-bold tracking-tight">{quiz.title}</h1>
      <p className="mt-2 text-[15px] text-mute">
        {SUBJECTS[quiz.subject].label} · {quiz.answered} of {quiz.total} answered · {quiz.score}/{quiz.total}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${fill}%` }} />
      </div>
      {quiz.done || !quiz.next ? (
        <section className="mt-5 rounded-[22px] bg-white p-4">
          <p className="text-[18px] font-semibold">Quiz complete</p>
          <p className="mt-2 text-[15px] leading-6 text-mute">
            You scored {quiz.score} out of {quiz.total}. The weakest-topic list will pick this up.
          </p>
          <Link href="/progress" className="mt-4 inline-block text-[15px] font-semibold text-brand">
            See your progress
          </Link>
        </section>
      ) : (
        <form action="/api/mark" method="post" className="mt-5 flex flex-col gap-3">
          <input type="hidden" name="questionId" value={quiz.next.id} />
          <input type="hidden" name="next" value={`/practice/quiz/${slug}`} />
          <article className="rounded-[22px] bg-white p-4">
            <p className="text-[13px] font-semibold text-brand">Question {quiz.answered + 1}</p>
            <p className="mt-2 text-[16px] leading-7">{quiz.next.stem}</p>
          </article>
          {quiz.next.choices?.map((choice) => (
            <button
              key={choice.id}
              type="submit"
              name="choice"
              value={choice.id}
              className="rounded-[18px] bg-white px-4 py-4 text-left text-[15px] leading-6 shadow-[0_8px_28px_rgba(40,32,80,0.04)] hover:ring-2 hover:ring-brand"
            >
              {choice.text}
            </button>
          ))}
        </form>
      )}
    </Screen>
  );
}
