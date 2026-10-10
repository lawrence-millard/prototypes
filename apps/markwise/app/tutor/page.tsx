import { connection } from "next/server";
import { requirePageUser } from "@/lib/auth";
import { tutorState } from "@/lib/queries";
import { SUBJECTS } from "@/lib/subjects";
import { DynamicScreen, Screen } from "@/components/screen";
import { TutorChat } from "@/components/tutor-chat";

export const metadata = { title: "Ask Markwise" };

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <DynamicScreen>
      <Tutor searchParams={searchParams} />
    </DynamicScreen>
  );
}

async function Tutor({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const user = await requirePageUser();
  const params = await searchParams;
  const attemptId = typeof params.attempt === "string" ? params.attempt : undefined;
  const state = await tutorState(user.id, { attemptId });

  return (
    <Screen>
      <TutorChat
        chatId={state.chatId}
        subjectLabel={SUBJECTS[state.subject].label}
        specLabel={state.specLabel}
        topicName={state.topicName}
        initialMessages={state.messages}
      />
    </Screen>
  );
}
