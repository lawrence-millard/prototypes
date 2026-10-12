import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { hasClerk } from "@/lib/auth";
import { PageFallback } from "@/components/screen";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  if (!hasClerk()) redirect("/home");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
      <Suspense fallback={<PageFallback />}>
        <SignUp fallbackRedirectUrl="/onboarding" />
      </Suspense>
    </div>
  );
}
