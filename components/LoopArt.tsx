// Small looping illustrations for the landing "Why Tayyari" cards.
// Pure SVG + CSS keyframes (see .lp-* in globals.css); motion is disabled under prefers-reduced-motion.

const INK = "var(--ink)";
const r1 = (n: number) => Math.round(n * 10) / 10; // stable SSR/client output
const CREAM = "var(--cream-3)";

// A ticking stopwatch beside a question palette that fills in, one answer at a time.
export function ExamLoop() {
  return (
    <svg viewBox="0 0 220 120" className="loop-art" aria-hidden>
      <rect x="55" y="16" width="14" height="8" rx="2" fill={INK} />
      <circle cx="62" cy="66" r="38" fill="none" stroke={INK} strokeWidth="2.5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={r1(62 + Math.sin(a) * 31)} y1={r1(66 - Math.cos(a) * 31)} x2={r1(62 + Math.sin(a) * 35)} y2={r1(66 - Math.cos(a) * 35)} stroke={INK} strokeWidth={i % 3 ? 1.2 : 2.4} />;
      })}
      <line x1="62" y1="66" x2="62" y2="38" stroke={INK} strokeWidth="2.5" strokeLinecap="round" className="lp-hand" />
      <circle cx="62" cy="66" r="3.5" fill={INK} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={124 + (i % 4) * 22} y={30 + Math.floor(i / 4) * 22} width="16" height="16" rx="4"
          fill={CREAM} stroke={INK} strokeWidth="1" className="lp-cell" style={{ animationDelay: `${i * 0.38}s` }} />
      ))}
    </svg>
  );
}

// "You" climbs from third to first while the others step down.
export function RankLoop() {
  const row = (y: number, you: boolean, w: number) => (
    <g>
      <rect x="22" y={y} width="176" height="26" rx="7" fill={you ? INK : "var(--surface)"} stroke={INK} strokeWidth={you ? 0 : 1} />
      <circle cx="40" cy={y + 13} r="7" fill={you ? "var(--cream)" : CREAM} />
      {you
        ? <text x="54" y={y + 17.5} fontSize="12" fontWeight="600" fill="var(--cream)">You</text>
        : <rect x="54" y={y + 10} width={w} height="6" rx="3" fill={CREAM} />}
      <rect x="160" y={y + 10} width="26" height="6" rx="3" fill={you ? "var(--ink-3)" : CREAM} />
    </g>
  );
  return (
    <svg viewBox="0 0 220 120" className="loop-art" aria-hidden>
      <g className="lp-rank-a">{row(47, false, 62)}</g>
      <g className="lp-rank-b">{row(79, false, 48)}</g>
      <g className="lp-rank-you">{row(15, true, 0)}</g>
      <g className="lp-up"><path d="M206 30l6 8h-12z" fill={INK} /></g>
    </svg>
  );
}

// A week of streak dots filling in, with points floating up as each day lands.
export function StreakLoop() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <svg viewBox="0 0 220 120" className="loop-art" aria-hidden>
      <text x="110" y="38" textAnchor="middle" fontSize="22" fontFamily="var(--serif)" fontStyle="italic" fill={INK}>7-day streak</text>
      <text x="168" y="26" fontSize="11" fontWeight="600" fill={INK} className="lp-float">+10</text>
      <line x1="34" y1="72" x2="186" y2="72" stroke={CREAM} strokeWidth="2" />
      {days.map((d, i) => (
        <g key={i}>
          <circle cx={r1(34 + i * 25.3)} cy="72" r="9" fill={CREAM} stroke={INK} strokeWidth="1.5" className="lp-day" style={{ animationDelay: `${i * 0.5}s` }} />
          <text x={r1(34 + i * 25.3)} y="102" textAnchor="middle" fontSize="10" fill="var(--muted)">{d}</text>
        </g>
      ))}
    </svg>
  );
}

// Subject bars rise and an accuracy line draws itself across them.
export function ChartLoop() {
  const bars = [44, 62, 38, 70, 56, 82];
  return (
    <svg viewBox="0 0 220 120" className="loop-art" aria-hidden>
      <line x1="20" y1="104" x2="200" y2="104" stroke={INK} strokeWidth="1.5" />
      {bars.map((h, i) => (
        <rect key={i} x={30 + i * 28} y={104 - h} width="16" height={h} rx="3" fill={i === 5 ? INK : CREAM}
          className="lp-bar" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
      <path d="M38 78 L66 58 L94 70 L122 44 L150 52 L178 22" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lp-line" pathLength={1} />
      <circle cx="178" cy="22" r="4.5" fill={INK} className="lp-dot" />
    </svg>
  );
}
