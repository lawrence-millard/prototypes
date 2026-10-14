import { Suspense } from "react";
import { ClerkSignIn } from "@/components/clerk-auth";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { hasClerk } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { safeNext } from "@/lib/redirect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const redirectTo = safeNext(next, brand.next);
  return (
    <Shell>
      {hasClerk() ? (
        <Suspense fallback={<Skeleton />}>
          <ClerkSignIn redirectTo={redirectTo} />
        </Suspense>
      ) : null}
    </Shell>
  );
}
