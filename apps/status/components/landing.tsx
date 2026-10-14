import { brand } from "@/lib/brand";

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">{brand.line}</p>
      <div className="preview" aria-hidden="true">
        <svg viewBox="0 0 440 168" fill="none">
          <rect x="0.5" y="0.5" width="439" height="167" rx="10" stroke="currentColor" strokeOpacity="0.35" />
          <Status y={28} w={120} ok />
          <line x1="20" y1="64" x2="420" y2="64" stroke="currentColor" strokeOpacity="0.2" />
          <Status y={80} w={88} ok />
          <line x1="20" y1="116" x2="420" y2="116" stroke="currentColor" strokeOpacity="0.2" />
          <Status y={132} w={104} ok={false} />
        </svg>
      </div>
      <a className="primary" href="/sign-in">
        Sign in
      </a>
    </section>
  );
}

function Status({ y, w, ok }: { y: number; w: number; ok: boolean }) {
  return (
    <g>
      <circle cx="28" cy={y + 6} r="4" fill={ok ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" />
      <rect x="44" y={y} width={w} height="8" rx="2" fill="currentColor" />
      <rect x="360" y={y} width="48" height="8" rx="2" fill="currentColor" opacity="0.35" />
    </g>
  );
}
