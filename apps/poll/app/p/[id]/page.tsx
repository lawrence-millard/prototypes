import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { VoteForm } from "@/components/vote";
import { currentUserId } from "@/lib/auth";
import { getPoll } from "@/lib/queries";
import { z } from "zod";

export const dynamic = "force-dynamic";

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  return (
    <Shell returnTo={`/p/${id}`}>
      <Suspense fallback={<Skeleton />}>
        <Poll id={id} />
      </Suspense>
    </Shell>
  );
}

async function Poll({ id }: { id: string }) {
  const userId = (await currentUserId()) ?? "";
  try {
    const poll = await getPoll(id, userId);
    if (!poll) notFound();
    return <VoteForm pollId={id} question={poll.question} closed={poll.closed} options={poll.options} signedIn={userId !== ""} />;
  } catch {
    return (
      <p className="error" role="alert">
        Could not load.
      </p>
    );
  }
}
