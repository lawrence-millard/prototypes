"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { clerkAppearance } from "@/lib/appearance";

export function AccountMenu({ signedIn, clerk, href }: { signedIn: boolean; clerk: boolean; href: string }) {
  const dark = useDark();
  if (!signedIn) {
    return (
      <a className="signin" href={href}>
        Sign in
      </a>
    );
  }
  if (!clerk) {
    return (
      <span className="avatar" aria-label="Account">
        P
      </span>
    );
  }
  return <UserButton appearance={clerkAppearance(dark)} />;
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
