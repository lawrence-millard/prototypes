"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { clerkAppearance } from "@/components/clerk-appearance";

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export function ClerkSignInCard() {
  const dark = useDark();
  return <SignIn appearance={clerkAppearance(dark)} fallbackRedirectUrl="/onboarding" />;
}

export function ClerkSignUpCard() {
  const dark = useDark();
  return <SignUp appearance={clerkAppearance(dark)} fallbackRedirectUrl="/onboarding" />;
}
