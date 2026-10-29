import { useId } from "react";

// The Tayyari asterisk: seven uneven arms from one centre, with a stamped-ink edge.
// Arm end points are traced from the brand mark (centre 540,580 on a 1080 canvas).
const ARMS = [[540, 390], [430, 475], [622, 492], [672, 590], [588, 655], [480, 685], [436, 582]];
export const MARK_PATH = ARMS.map(([x, y]) => `M540 580L${x} ${y}`).join("");

export function Mark({ size = 28, color = "currentColor", grain = size >= 40, spin = false, className }: { size?: number; color?: string; grain?: boolean; spin?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="391 377 320 320" aria-hidden className={`${spin ? "mark-spin" : ""} ${className ?? ""}`} style={{ flexShrink: 0, display: "block" }}>
      {grain && (
        <defs>
          <filter id={`g${id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="7" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="9" result="s" />
            <feColorMatrix in="s" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.35" result="m" />
            <feComposite in="d" in2="m" operator="in" />
          </filter>
        </defs>
      )}
      <path d={MARK_PATH} stroke={color} strokeWidth={31} strokeLinecap="butt" fill="none" filter={grain ? `url(#g${id})` : undefined} />
    </svg>
  );
}
