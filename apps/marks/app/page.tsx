import { Suspense } from "react";
import { Board } from "@/components/board";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { currentUserId } from "@/lib/auth";
import { listBookmarks } from "@/lib/queries";
import { parseTags } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default function HomePage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  return (
    <Shell>
      <Suspense fallback={<Skeleton />}>
        <List searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function List({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag: rawTag } = await searchParams;
  const parsed = rawTag ? parseTags(rawTag) : null;
  const tag = parsed && parsed.ok && parsed.tags.length === 1 ? parsed.tags[0] : null;
  const userId = await currentUserId();
  if (!userId) return <Board items={null} tags={[]} active={null} signedIn={false} />;
  try {
    const data = await listBookmarks(userId, tag);
    return <Board items={data.bookmarks} tags={data.tags} active={tag} signedIn />;
  } catch {
    return (
      <p className="error" role="alert">
        Could not load.
      </p>
    );
  }
}
