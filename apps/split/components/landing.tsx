import { brand } from "@/lib/brand";

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">{brand.line}</p>
      <div className="preview" aria-hidden="true">
        <svg viewBox="0 0 440 168" fill="none">
          <rect x="0.5" y="0.5" width="439" height="167" rx="10" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="20" y="24" width="18" height="18" rx="9" stroke="currentColor" strokeOpacity="0.55" />
          <rect x="48" y="29" width="64" height="8" rx="2" fill="currentColor" />
          <rect x="340" y="29" width="72" height="8" rx="2" fill="currentColor" opacity="0.45" />
          <line x1="20" y1="62" x2="420" y2="62" stroke="currentColor" strokeOpacity="0.2" />
          <rect x="20" y="78" width="18" height="18" rx="9" stroke="currentColor" strokeOpacity="0.55" />
          <rect x="48" y="83" width="52" height="8" rx="2" fill="currentColor" />
          <rect x="340" y="83" width="72" height="8" rx="2" fill="currentColor" opacity="0.45" />
          <line x1="20" y1="116" x2="420" y2="116" stroke="currentColor" strokeOpacity="0.2" />
          <rect x="20" y="132" width="180" height="8" rx="2" fill="currentColor" opacity="0.35" />
        </svg>
      </div>
      <a className="primary" href="/sign-in">
        Sign in
      </a>
    </section>
  );
}
