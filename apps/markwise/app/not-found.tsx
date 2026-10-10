import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-8">
      <p className="text-[22px] font-bold text-brand">Markwise</p>
      <h1 className="mt-6 text-[32px] font-bold tracking-tight">That page is missing</h1>
      <p className="mt-3 text-[16px] leading-6 text-mute">The question or paper may not be on your spec.</p>
      <Link href="/home" className="mt-8 text-[16px] font-semibold text-brand">
        Back to today&apos;s plan
      </Link>
    </main>
  );
}
