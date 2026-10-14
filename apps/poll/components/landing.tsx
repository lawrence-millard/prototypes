import { brand } from "@/lib/brand";

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">{brand.line}</p>
      <div className="preview" aria-hidden="true">
        <svg viewBox="0 0 440 168" fill="none">
          <rect x="0.5" y="0.5" width="439" height="167" rx="10" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="20" y="22" width="168" height="10" rx="2" fill="currentColor" />
          <rect x="20" y="52" width="280" height="36" rx="8" fill="currentColor" opacity="0.08" />
          <rect x="32" y="66" width="96" height="8" rx="2" fill="currentColor" />
          <rect x="20" y="100" width="168" height="36" rx="8" fill="currentColor" opacity="0.05" />
          <rect x="32" y="114" width="72" height="8" rx="2" fill="currentColor" opacity="0.55" />
        </svg>
      </div>
      <a className="primary" href="/sign-in">
        Sign in
      </a>
    </section>
  );
}
