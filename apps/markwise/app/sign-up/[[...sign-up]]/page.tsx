import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { hasClerk } from "@/lib/auth";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  if (!hasClerk()) redirect("/home");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
      <SignUp fallbackRedirectUrl="/onboarding" />
    </div>
  );
}
