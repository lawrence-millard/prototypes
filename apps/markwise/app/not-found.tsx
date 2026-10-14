import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[500px] flex-col px-4 pt-16">
      <p className="label">Markwise</p>
      <h1 className="mt-3 text-[26px] tracking-tight">Not found</h1>
      <Link href="/home" className="mt-8 text-[16px]">
        Today
      </Link>
    </main>
  );
}
