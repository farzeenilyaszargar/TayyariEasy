// Circular score gauge used on results, completion and the landing preview.
export function ScoreRing({ value, max, size = 120, stroke = 10, label }: { value: number; max: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / (max || 1)));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cream-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ink)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div className="num" style={{ fontFamily: "var(--serif)", fontSize: size * 0.3, fontWeight: 400, color: "var(--text-strong)", lineHeight: 1, letterSpacing: "-0.01em" }}>{value}</div>
          <div className="muted num" style={{ fontSize: Math.max(11, size * 0.1), marginTop: 3 }}>{label ?? `of ${max}`}</div>
        </div>
      </div>
    </div>
  );
}
