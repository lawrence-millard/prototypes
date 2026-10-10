import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Markwise",
    template: "%s · Markwise",
  },
  description: "A Level revision with levels-based marking, a hinting tutor, and a daily plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const clerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper font-sans text-ink">
        {clerk ? <ClerkProvider>{children}</ClerkProvider> : children}
      </body>
    </html>
  );
}
