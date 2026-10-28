/* eslint-disable @next/next/no-img-element */
export const AVATAR_COLORS = ["#4f46e5", "#7c5cff", "#0e7fc0", "#12a37a", "#d97706", "#e5484d", "#c2417e", "#334155"];

export function Avatar({ name, url, color, size = 36 }: { name?: string | null; url?: string | null; color?: string | null; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: color ?? AVATAR_COLORS[0] }}>
      {url ? <img src={url} alt="" /> : (name ?? "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}
