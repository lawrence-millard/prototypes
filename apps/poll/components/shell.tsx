import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentUserId, hasClerk } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { safeNext } from "@/lib/redirect";

export async function Shell({ returnTo = "/", children }: { returnTo?: string; children: React.ReactNode }) {
  const next = safeNext(returnTo, brand.next);
  const href = next === "/" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`;
  return (
    <>
      <ThemeToggle />
      <main className="col">
        <header className="brand">
          <div className="logo" aria-hidden="true">
            {brand.letter}
          </div>
          <div>
            <h1>{brand.name}</h1>
            <Account href={href} />
          </div>
        </header>
        {children}
      </main>
    </>
  );
}

async function Account({ href }: { href: string }) {
  if (!hasClerk()) {
    return (
      <p className="dim">
        <a href={href}>Sign in</a>
      </p>
    );
  }
  const userId = await currentUserId();
  if (!userId) {
    return (
      <p className="dim">
        <a href={href}>Sign in</a>
      </p>
    );
  }
  return <UserButton />;
}
