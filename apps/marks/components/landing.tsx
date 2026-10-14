import { brand } from "@/lib/brand";

export function Landing() {
  return (
    <section className="landing">
      <p className="lede">{brand.line}</p>
      <div className="preview" aria-hidden="true">
        <svg viewBox="0 0 440 188" fill="none">
          <rect x="0.5" y="0.5" width="439" height="187" rx="10" stroke="currentColor" strokeOpacity="0.35" />
          <Row y={28} title={148} host={92} tag={36} />
          <line x1="20" y1="70" x2="420" y2="70" stroke="currentColor" strokeOpacity="0.2" />
          <Row y={86} title={112} host={70} tag={28} />
          <line x1="20" y1="128" x2="420" y2="128" stroke="currentColor" strokeOpacity="0.2" />
          <Row y={144} title={96} host={120} tag={0} />
        </svg>
      </div>
      <a className="primary" href="/sign-in">
        Sign in
      </a>
    </section>
  );
}

function Row({ y, title, host, tag }: { y: number; title: number; host: number; tag: number }) {
  return (
    <g>
      <circle cx="28" cy={y + 8} r="3" fill="currentColor" />
      <rect x="44" y={y} width={title} height="8" rx="2" fill="currentColor" />
      <rect x="44" y={y + 16} width={host} height="6" rx="2" fill="currentColor" opacity="0.35" />
      {tag ? <rect x={420 - tag} y={y - 2} width={tag} height="16" rx="8" stroke="currentColor" strokeOpacity="0.35" /> : null}
    </g>
  );
}
