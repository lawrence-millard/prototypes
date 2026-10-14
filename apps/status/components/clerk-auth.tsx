"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { clerkAppearance } from "@/lib/appearance";

export function ClerkSignIn({ redirectTo }: { redirectTo: string }) {
  const dark = useDark();
  const signUpUrl = redirectTo === "/" ? "/sign-up" : `/sign-up?next=${encodeURIComponent(redirectTo)}`;
  return (
    <div className="clerk-wrap">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl={signUpUrl}
        forceRedirectUrl={redirectTo}
        appearance={clerkAppearance(dark)}
      />
    </div>
  );
}

export function ClerkSignUp({ redirectTo }: { redirectTo: string }) {
  const dark = useDark();
  const signInUrl = redirectTo === "/" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(redirectTo)}`;
  return (
    <div className="clerk-wrap">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl={signInUrl}
        forceRedirectUrl={redirectTo}
        appearance={clerkAppearance(dark)}
      />
    </div>
  );
}

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}
