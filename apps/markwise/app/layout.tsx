import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const themeBoot = `try{var t=localStorage.getItem("theme");var d=document.documentElement;if(t==="dark"||t==="light")d.dataset.theme=t;else if(matchMedia("(prefers-color-scheme: dark)").matches)d.dataset.theme="dark"}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://markwise.millard.ink"),
  title: {
    default: "Markwise",
    template: "%s · Markwise",
  },
  description: "A Level revision.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerk = Boolean(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const body = (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      <ThemeToggle />
      {children}
    </>
  );
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-paper font-sans">
        {clerk ? (
          <ClerkProvider dynamic signInUrl="/sign-in" signUpUrl="/sign-up">
            {body}
          </ClerkProvider>
        ) : (
          body
        )}
      </body>
    </html>
  );
}
