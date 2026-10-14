import { Suspense } from "react";
import { Board } from "@/components/board";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { currentUserId } from "@/lib/auth";
import { loadMonitors } from "@/lib/queries";

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
