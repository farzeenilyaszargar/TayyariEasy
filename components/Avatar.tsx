/* eslint-disable @next/next/no-img-element */
export const AVATAR_COLORS = ["#1cb0f6", "#58cc02", "#ff9600", "#ce82ff", "#ff4b4b", "#ff86d0", "#2b70c9", "#00cd9c"];

export function Avatar({ name, url, color, size = 36 }: { name?: string | null; url?: string | null; color?: string | null; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: color ?? AVATAR_COLORS[0] }}>
      {url ? <img src={url} alt="" /> : (name ?? "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}
