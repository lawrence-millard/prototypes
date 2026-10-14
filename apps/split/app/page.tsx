import { Suspense } from "react";
import { Board } from "@/components/board";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { currentUserId } from "@/lib/auth";
import { listGroups } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Shell>
      <Suspense fallback={<Skeleton />}>
        <List />
      </Suspense>
    </Shell>
  );
}

async function List() {
  const userId = await currentUserId();
  if (!userId) return <Board items={null} signedIn={false} />;
  try {
    const items = await listGroups(userId);
    return <Board items={items} signedIn />;
  } catch {
    return (
      <p className="error" role="alert">
        Could not load.
      </p>
    );
  }
}
