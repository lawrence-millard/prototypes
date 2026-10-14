import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { hasClerk } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { redirectOrigins } from "@/lib/origins";
import "./globals.css";

const themeBoot = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(brand.origin),
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: brand.description,
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = hasClerk() ? (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      allowedRedirectOrigins={redirectOrigins()}
      telemetry={false}
    >
      {children}
    </ClerkProvider>
  ) : (
    children
  );
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        {content}
      </body>
    </html>
  );
}
