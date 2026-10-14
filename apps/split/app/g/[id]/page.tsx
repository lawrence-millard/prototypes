import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { GroupBoard } from "@/components/group";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { currentUserId } from "@/lib/auth";
import { getGroup } from "@/lib/queries";
import { z } from "zod";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const userId = await currentUserId();
  if (!userId) redirect(`/sign-in?next=${encodeURIComponent(`/g/${id}`)}`);
  return (
    <Shell returnTo={`/g/${id}`}>
      <Suspense fallback={<Skeleton />}>
        <Group id={id} userId={userId} />
      </Suspense>
    </Shell>
  );
}

async function Group({ id, userId }: { id: string; userId: string }) {
  try {
    const group = await getGroup(userId, id);
    if (!group) notFound();
    return <GroupBoard group={group} />;
  } catch {
    return (
      <p className="error" role="alert">
        Could not load.
      </p>
    );
  }
}
