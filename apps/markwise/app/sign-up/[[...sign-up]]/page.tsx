import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasClerk } from "@/lib/auth";
import { ClerkSignUpCard } from "@/components/clerk-card";
import { PageFallback } from "@/components/screen";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  if (!hasClerk()) redirect("/home");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <Suspense fallback={<PageFallback />}>
        <ClerkSignUpCard />
      </Suspense>
    </main>
  );
}
