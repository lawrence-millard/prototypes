import Link from "next/link";
import { connection } from "next/server";
import { requirePageUser } from "@/lib/auth";
import { saveProfile, saveTargets } from "@/lib/actions";
import { onboardingState } from "@/lib/queries";
import { GRADES, SUBJECT_ORDER } from "@/lib/subjects";
import { DynamicScreen, PrimaryButton, Screen, Wordmark } from "@/components/screen";
import { SubjectList } from "@/components/subject-list";

export const metadata = { title: "Subjects" };

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <DynamicScreen>
      <Onboarding searchParams={searchParams} />
    </DynamicScreen>
  );
}

async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const user = await requirePageUser();
  const params = await searchParams;
  const requested = typeof params.step === "string" ? params.step : user.onboarded ? "2" : "1";
  const step = requested === "1" || requested === "3" ? requested : "2";
  const error = typeof params.error === "string" ? params.error : "";
  const subjects = await onboardingState(user.id);
  const ordered = SUBJECT_ORDER.map((id) => subjects.find((subject) => subject.subject === id)).filter(
    (subject): subject is NonNullable<typeof subject> => Boolean(subject),
  );

  if (step === "1") {
    return (
      <Screen>
        <form action={saveProfile} className="flex flex-1 flex-col">
          <Wordmark />
          <p className="label mt-6">1 / 3</p>
          <h1 className="mt-3 text-[26px] tracking-tight">Name</h1>
          <label className="mt-6 block">
            <span className="text-[14px] font-medium text-ink">First name</span>
            <input
              name="name"
              defaultValue={user.displayName}
              maxLength={40}
              required
              className="mt-2 h-14 w-full rounded-[10px] border border-line bg-surface px-4 text-[16px] outline-none border border-line"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-[14px] font-medium text-ink">When do your A Level exams start?</span>
            <input
              type="date"
              name="examDate"
              defaultValue={user.examDate ?? "2027-05-14"}
              required
              className="mt-2 h-14 w-full rounded-[10px] border border-line bg-surface px-4 text-[16px] outline-none border border-line"
            />
          </label>
          {error === "date" ? <p className="mt-3 text-[14px] text-bad">Choose an exam date.</p> : null}
          <div className="mt-auto pt-8">
            <PrimaryButton>Continue</PrimaryButton>
          </div>
        </form>
      </Screen>
    );
  }

  if (step === "3") {
    return (
      <Screen>
        <form action={saveTargets} className="flex flex-1 flex-col">
          <Wordmark />
          <p className="label mt-6">3 / 3</p>
          <h1 className="mt-3 text-[26px] tracking-tight">Targets</h1>
          <div className="mt-6 flex flex-col gap-3">
            {ordered.map((subject) => (
              <label key={subject.subject} className="flex items-center justify-between rounded-[10px] border border-line bg-surface px-4 py-4">
                <span className="text-[17px] font-medium">{subject.label}</span>
                <select
                  name={subject.subject}
                  defaultValue={subject.target}
                  className="rounded-[8px] bg-brand-soft px-3 py-2 text-[15px] font-medium text-brand outline-none"
                >
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-auto pt-8">
            <PrimaryButton>Continue</PrimaryButton>
          </div>
        </form>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Link
          href="/onboarding?step=3"
          className="flex h-[52px] w-full items-center justify-center rounded-[8px] bg-brand text-[16px] font-medium text-on-brand"
        >
          Continue
        </Link>
      }
    >
      <Wordmark />
      <p className="label mt-6">2 / 3</p>
      <h1 className="mt-3 text-[26px] tracking-tight">Subjects</h1>
      <SubjectList items={ordered} />
    </Screen>
  );
}
