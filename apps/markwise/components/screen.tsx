import { Suspense } from "react";

export function DynamicScreen({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export function PageFallback() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[430px] px-5 pt-8">
      <p className="text-[22px] font-bold tracking-tight text-brand">Markwise</p>
    </div>
  );
}

export function Screen({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-8 pb-8">
      <div className="flex flex-1 flex-col">{children}</div>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </main>
  );
}

export function Wordmark() {
  return <p className="text-[22px] font-bold tracking-tight text-brand">Markwise</p>;
}

export function PrimaryButton({
  children,
  type = "submit",
  disabled,
  name,
  value,
  formAction,
}: {
  children: React.ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
  name?: string;
  value?: string;
  formAction?: string;
}) {
  return (
    <button
      type={type}
      name={name}
      value={value}
      formAction={formAction}
      disabled={disabled}
      className="flex h-[52px] w-full items-center justify-center rounded-full bg-brand px-4 text-[16px] font-semibold text-white transition hover:bg-brand-deep disabled:opacity-60"
    >
      {children}
    </button>
  );
}
