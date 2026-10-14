import { AccountMenu } from "@/components/account";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentUserId, hasClerk } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { safeNext } from "@/lib/redirect";

export async function Shell({
  returnTo = "/",
  centered = false,
  children,
}: {
  returnTo?: string;
  centered?: boolean;
  children: React.ReactNode;
}) {
  const next = safeNext(returnTo, brand.next);
  const href = next === "/" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`;
  const userId = await currentUserId();
  return (
    <main className={centered ? "col center" : "col"}>
      <header className="top">
        <a className="brand" href="/">
          <span className="mark" aria-hidden="true">
            {brand.letter}
          </span>
          <h1>{brand.name}</h1>
        </a>
        <div className="top-end">
          <ThemeToggle />
          <AccountMenu signedIn={Boolean(userId)} clerk={hasClerk()} href={href} />
        </div>
      </header>
      {children}
    </main>
  );
}
