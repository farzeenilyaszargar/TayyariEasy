export type BadgePreview = {
  id: string;
  name: string;
  how: string;
  image: string;
};

const ALL_BADGES: BadgePreview[] = [
  {
    id: "first-test",
    name: "First Test Completed",
    how: "Complete your first scored mock test.",
    image: "/badges/curve text.png"
  },
  {
    id: "precision",
    name: "Precision Pilot",
    how: "Maintain 85%+ accuracy across 5 tests.",
    image: "/badges/precision pilot.png"
  },
  {
    id: "streak14",
    name: "Streak Builder",
    how: "Study or test for 14 consecutive days.",
    image: "/badges/streak builder.png"
  },
  {
    id: "speed50",
    name: "Speed Solver",
    how: "Solve 50 timed questions under target.",
    image: "/badges/speed solver.png"
  },
  {
    id: "mock3",
    name: "Mock Marathon",
    how: "Complete 3 full mocks in one week.",
    image: "/badges/mock marathon.png"
  },
  {
    id: "physics",
    name: "Physics Pro",
    how: "Score 90+ in two Physics tests in a row.",
    image: "/badges/physics pro.png"
  },
  {
    id: "chemistry",
    name: "Chem Master",
    how: "Score 90+ in two Chemistry tests in a row.",
    image: "/badges/chem master.png"
  },
  {
    id: "math",
    name: "Math Ace",
    how: "Score 90+ in two Math tests in a row.",
    image: "/badges/maths ace.png"
  },
  {
    id: "comeback",
    name: "Comeback Clutch",
    how: "Improve total score by 30+ marks in 7 days.",
    image: "/badges/comeback clutch.png"
  },
  {
    id: "consistency",
    name: "Consistency Crown",
    how: "Keep score variance under 10 marks for 5 tests.",
    image: "/badges/consistency crown.png"
  },
  {
    id: "accuracy95",
    name: "Accuracy Titan",
    how: "Hit 95%+ accuracy in any full mock.",
    image: "/badges/accuracy titan.png"
  },
  {
    id: "daily7",
    name: "Seven Day Focus",
    how: "Complete at least one practice session daily for 7 days.",
    image: "/badges/7 day focus.png"
  },
  {
    id: "revision",
    name: "Revision Master",
    how: "Finish 3 planned revision cycles in one week.",
    image: "/badges/revision master.png"
  },
  {
    id: "timing",
    name: "Timing Tactician",
    how: "Finish two full tests within planned exam time.",
    image: "/badges/timing tactician.png"
  },
  {
    id: "streak30",
    name: "Streak 30",
    how: "Maintain a 30-day active prep streak.",
    image: "/badges/sreak 30.png"
  },
  {
    id: "allrounder",
    name: "All-Rounder",
    how: "Score above 80 in Physics, Chemistry, and Math in one mock.",
    image: "/badges/all rounder.png"
  },
  {
    id: "customization",
    name: "Profile Customized",
    how: "Set your profile identity and target college.",
    image: "/badges/customization.png"
  }
];

export const BADGE_PREVIEWS: BadgePreview[] = ALL_BADGES.filter(
  (badge) => badge.id !== "first-test" && badge.id !== "customization"
);

const imageByNormalizedName = new Map<string, string>(
  ALL_BADGES.map((badge) => [normalizeBadgeKey(badge.name), badge.image])
);

function normalizeBadgeKey(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const aliases: Array<[string, string]> = [
  ["maths ace", "Math Ace"],
  ["math ace", "Math Ace"],
  ["all rounder", "All-Rounder"],
  ["all-rounder", "All-Rounder"],
  ["seven day focus", "Seven Day Focus"],
  ["7 day focus", "Seven Day Focus"],
  ["streak 30", "Streak 30"],
  ["sreak 30", "Streak 30"],
  ["profile customization", "Profile Customized"],
  ["profile customised", "Profile Customized"],
  ["first test complete", "First Test Completed"],
  ["first test completed", "First Test Completed"]
];

for (const [key, value] of aliases) {
  const image = imageByNormalizedName.get(normalizeBadgeKey(value));
  if (image) {
    imageByNormalizedName.set(normalizeBadgeKey(key), image);
  }
}

export function getBadgeImageForName(name: string) {
  return imageByNormalizedName.get(normalizeBadgeKey(name)) || "/badges/curve text.png";
}
