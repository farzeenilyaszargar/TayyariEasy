import {
  Atom, BarChart3, Brain, CalendarDays, CircleCheck, Crown, FileText, Flag, FlaskConical, Flame, Footprints, Gem, GraduationCap,
  Hand, Hourglass, Layers, Lightbulb, Lock, Mail, Medal, Moon, NotebookPen, Rocket, ShieldCheck, Sigma, Smartphone, Sparkles,
  Star, Target, Timer, TrendingUp, Trophy, Zap, type LucideIcon,
} from "lucide-react";

// One icon language for the whole product: line icons, same stroke, on soft tinted tiles.
const ICONS = {
  trophy: Trophy, fire: Flame, bolt: Zap, paper: FileText, books: Layers, chart: BarChart3, rising: TrendingUp,
  target: Target, atom: Atom, flask: FlaskConical, abacus: Sigma, crown: Crown, medal: Medal, gold: Medal, silver: Medal,
  bronze: Medal, party: CircleCheck, gem: Gem, cap: GraduationCap, bulb: Lightbulb, star: Star, stopwatch: Timer,
  calendar: CalendarDays, rocket: Rocket, memo: NotebookPen, check: CircleCheck, moon: Moon, shield: ShieldCheck,
  footprints: Footprints, flag: Flag, brain: Brain, student: GraduationCap, wave: Hand, lock: Lock, phone: Smartphone,
  mail: Mail, sparkles: Sparkles, hourglass: Hourglass,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

// Every tile is charcoal ink on cream; `tint` is kept for call sites but all tints resolve to cream.
const INK = "var(--ink)";

export function Glyph({ name, size = 18, color, strokeWidth = 1.6, style }: { name: IconName; size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties }) {
  const I = ICONS[name];
  return <I size={size} color={color} strokeWidth={strokeWidth} style={{ flexShrink: 0, ...style }} aria-hidden />;
}

export function IconTile({ name, size = 44, tint = "var(--tint-indigo)" }: { name: IconName; size?: number; tint?: string }) {
  const ink = INK;
  return (
    <span className="icon-tile" style={{ width: size, height: size, background: tint, color: ink }}>
      <Glyph name={name} size={Math.round(size * 0.44)} color={ink} />
    </span>
  );
}

// Larger round emblem for page headers and the completion screen.
export function Medallion({ name, size = 72, tint = "var(--tint-amber)" }: { name: IconName; size?: number; tint?: string }) {
  const ink = INK;
  return (
    <span className="medallion" style={{ width: size, height: size, background: tint, color: ink }}>
      <Glyph name={name} size={Math.round(size * 0.42)} color={ink} strokeWidth={1.7} />
    </span>
  );
}
