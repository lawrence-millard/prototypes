import { Suspense } from "react";
import { Board } from "@/components/board";
import { Landing } from "@/components/landing";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { currentUserId } from "@/lib/auth";
import { loadMonitors } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await currentUserId();
  if (!userId) {
    return (
      <Shell centered>
        <Landing />
      </Shell>
    );
  }
  return (
    <Shell>
      <Suspense fallback={<Skeleton />}>
        <List userId={userId} />
      </Suspense>
    </Shell>
  );
}

async function List({ userId }: { userId: string }) {
  try {
    const loaded = await loadMonitors(userId, false);
    return <Board items={loaded.items} signedIn />;
  } catch {
    return (
      <p className="error" role="alert">
        Could not load.
      </p>
    );
  }
}
