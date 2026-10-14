import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { capMessage } from "@/lib/caps";
import { questionForUser } from "@/lib/queries";
import { DynamicScreen, Screen } from "@/components/screen";
import { PracticeForm } from "@/components/practice-form";

export const metadata = { title: "Practice" };

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <DynamicScreen>
      <Practice params={params} searchParams={searchParams} />
    </DynamicScreen>
  );
}

async function Practice({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const user = await requirePageUser();
  const { id } = await params;
  const query = await searchParams;
  const page = await questionForUser(user.id, id);
  if (!page || page.question.type === "mcq") notFound();
  const error = query.error === "cap" ? capMessage("mark") : "";
  const saved = query.saved === "1";

  return (
    <Screen>
      <PracticeForm
        questionId={page.question.id}
        breadcrumb={page.question.breadcrumb}
        stem={page.question.stem}
        marks={page.question.marks}
        commandWord={page.question.commandWord}
        defaultAnswer={page.draft}
        error={error}
        notice={saved ? "Saved." : undefined}
      />
    </Screen>
  );
}
