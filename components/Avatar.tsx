/* eslint-disable @next/next/no-img-element */
// Charcoal-to-stone tones only. Any other saved colour (older picks, sample players) is folded into this palette.
export const AVATAR_COLORS = ["#1d1c1a", "#3a3833", "#5a564e", "#77726a", "#8c8577", "#4a4238", "#2f3330", "#6b5f52"];
function tone(color?: string | null) {
  if (!color) return AVATAR_COLORS[0];
  if (AVATAR_COLORS.includes(color.toLowerCase())) return color;
  let h = 0;
  for (const ch of color.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Avatar({ name, url, color, size = 36 }: { name?: string | null; url?: string | null; color?: string | null; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: tone(color) }}>
      {url ? <img src={url} alt="" /> : (name ?? "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}
