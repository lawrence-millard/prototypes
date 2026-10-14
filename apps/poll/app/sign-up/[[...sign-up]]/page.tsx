import { Suspense } from "react";
import { ClerkSignUp } from "@/components/clerk-auth";
import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/skeleton";
import { hasClerk } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { safeNext } from "@/lib/redirect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign up" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const redirectTo = safeNext(next, brand.next);
  return (
    <Shell>
      {hasClerk() ? (
        <Suspense fallback={<Skeleton />}>
          <ClerkSignUp redirectTo={redirectTo} />
        </Suspense>
      ) : null}
    </Shell>
  );
}
