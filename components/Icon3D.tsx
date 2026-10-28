/* eslint-disable @next/next/no-img-element */
// 3D icons from Microsoft Fluent Emoji (MIT), pinned to one commit so they never change underneath us.
const BASE = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@1ffb34c752ecf5d402f04cfb4b392c77f57c54bc/assets";

const PATHS = {
  trophy: "Trophy/3D/trophy_3d.png",
  fire: "Fire/3D/fire_3d.png",
  bolt: "High voltage/3D/high_voltage_3d.png",
  paper: "Page facing up/3D/page_facing_up_3d.png",
  books: "Books/3D/books_3d.png",
  chart: "Bar chart/3D/bar_chart_3d.png",
  rising: "Chart increasing/3D/chart_increasing_3d.png",
  target: "Bullseye/3D/bullseye_3d.png",
  atom: "Atom symbol/3D/atom_symbol_3d.png",
  flask: "Test tube/3D/test_tube_3d.png",
  abacus: "Abacus/3D/abacus_3d.png",
  crown: "Crown/3D/crown_3d.png",
  medal: "Sports medal/3D/sports_medal_3d.png",
  gold: "1st place medal/3D/1st_place_medal_3d.png",
  silver: "2nd place medal/3D/2nd_place_medal_3d.png",
  bronze: "3rd place medal/3D/3rd_place_medal_3d.png",
  party: "Party popper/3D/party_popper_3d.png",
  gem: "Gem stone/3D/gem_stone_3d.png",
  cap: "Graduation cap/3D/graduation_cap_3d.png",
  bulb: "Light bulb/3D/light_bulb_3d.png",
  star: "Glowing star/3D/glowing_star_3d.png",
  stopwatch: "Stopwatch/3D/stopwatch_3d.png",
  calendar: "Calendar/3D/calendar_3d.png",
  rocket: "Rocket/3D/rocket_3d.png",
  memo: "Memo/3D/memo_3d.png",
  check: "Check mark button/3D/check_mark_button_3d.png",
  moon: "Crescent moon/3D/crescent_moon_3d.png",
  shield: "Shield/3D/shield_3d.png",
  footprints: "Footprints/3D/footprints_3d.png",
  flag: "Chequered flag/3D/chequered_flag_3d.png",
  brain: "Brain/3D/brain_3d.png",
  student: "Student/Default/3D/student_3d_default.png",
  wave: "Waving hand/Default/3D/waving_hand_3d_default.png",
  lock: "Locked/3D/locked_3d.png",
  phone: "Mobile phone/3D/mobile_phone_3d.png",
  mail: "Envelope/3D/envelope_3d.png",
  sparkles: "Sparkles/3D/sparkles_3d.png",
  hourglass: "Hourglass not done/3D/hourglass_not_done_3d.png",
} as const;

export type Icon3DName = keyof typeof PATHS;

export const icon3dUrl = (name: Icon3DName) => `${BASE}/${PATHS[name].replace(/ /g, "%20")}`;

export function Icon3D({ name, size = 32, className, style }: { name: Icon3DName; size?: number; className?: string; style?: React.CSSProperties }) {
  return <img src={icon3dUrl(name)} alt="" width={size} height={size} className={className} style={{ display: "block", ...style }} draggable={false} />;
}

// Soft tinted tile with a 3D icon inside — used for papers, stats and badges.
export function IconTile({ name, size = 52, tint = "var(--tint-indigo)" }: { name: Icon3DName; size?: number; tint?: string }) {
  return (
    <span className="icon-tile" style={{ width: size, height: size, background: tint }}>
      <Icon3D name={name} size={Math.round(size * 0.62)} />
    </span>
  );
}
