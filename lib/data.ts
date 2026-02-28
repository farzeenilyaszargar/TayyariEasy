export const badges = [
  { id: "accuracy", name: "Precision Pilot", detail: "85%+ accuracy in last 10 tests" },
  { id: "streak", name: "Consistency Streak", detail: "Studied 14 days in a row" },
  { id: "speed", name: "Speed Solver", detail: "Solved 50 problems under target time" }
];

export const testsTaken = [
  { name: "JEE Main Mock #12", date: "2026-02-22", score: 198, percentile: 98.1 },
  { name: "Organic Chemistry Drill", date: "2026-02-20", score: 72, percentile: 94.6 },
  { name: "Physics Mechanics Sprint", date: "2026-02-18", score: 81, percentile: 96.9 }
];

export const aiInsights = [
  "You are losing marks in integer-type chemistry questions due to rounding errors.",
  "Your physics score rises 12-15 marks when you start with mechanics first.",
  "Predicted JEE Main rank band: 2,100 - 3,200 based on your last 8 tests."
];

export type SubjectTag = "Physics" | "Chemistry" | "Mathematics";
export type Difficulty = "Easy" | "Medium" | "Hard";

export type TestCard = {
  id: string;
  name: string;
  subject: SubjectTag;
  type: "Topic" | "Full";
  avgScore: number;
  difficulty: Difficulty;
  attempts: number;
  icon: string;
};

export type ResourceItem = {
  title: string;
  type: string;
  size: string;
  subject: SubjectTag;
  category: "Roadmaps" | "Strategies" | "Notes" | "Books" | "Problems" | "PYQs";
  preview: string;
  href: string;
};

export const topicTests: TestCard[] = [
  {
    id: "phy-kinematics",
    name: "Kinematics and Laws of Motion",
    subject: "Physics",
    type: "Topic",
    avgScore: 74,
    difficulty: "Medium",
    attempts: 8421,
    icon: "P"
  },
  {
    id: "phy-electro",
    name: "Electrostatics and Current Electricity",
    subject: "Physics",
    type: "Topic",
    avgScore: 69,
    difficulty: "Hard",
    attempts: 6955,
    icon: "P"
  },
  {
    id: "chem-organic",
    name: "Organic Reaction Mechanisms",
    subject: "Chemistry",
    type: "Topic",
    avgScore: 77,
    difficulty: "Medium",
    attempts: 9023,
    icon: "C"
  },
  {
    id: "math-calculus",
    name: "Calculus: Limits, AOD, Integrals",
    subject: "Mathematics",
    type: "Topic",
    avgScore: 71,
    difficulty: "Hard",
    attempts: 8114,
    icon: "M"
  },
  {
    id: "math-coordinate",
    name: "Coordinate Geometry",
    subject: "Mathematics",
    type: "Topic",
    avgScore: 79,
    difficulty: "Medium",
    attempts: 7331,
    icon: "M"
  }
];

export const fullSyllabusTests: TestCard[] = [
  {
    id: "full-main-a",
    name: "JEE Main Full Mock A",
    subject: "Physics",
    type: "Full",
    avgScore: 186,
    difficulty: "Medium",
    attempts: 4102,
    icon: "F"
  },
  {
    id: "full-main-b",
    name: "JEE Main Full Mock B",
    subject: "Chemistry",
    type: "Full",
    avgScore: 178,
    difficulty: "Hard",
    attempts: 3820,
    icon: "F"
  },
  {
    id: "full-main-c",
    name: "JEE Main Full Mock C",
    subject: "Mathematics",
    type: "Full",
    avgScore: 192,
    difficulty: "Medium",
    attempts: 4299,
    icon: "F"
  },
  {
    id: "full-adv-pattern",
    name: "JEE Advanced Pattern Test",
    subject: "Physics",
    type: "Full",
    avgScore: 154,
    difficulty: "Hard",
    attempts: 2440,
    icon: "A"
  }
];

export const leaderboard = [
  { rank: 1, name: "Aarav S.", points: 16420, tests: 116 },
  { rank: 2, name: "Diya M.", points: 15850, tests: 110 },
  { rank: 3, name: "Ishaan R.", points: 15210, tests: 104 },
  { rank: 4, name: "Nitya P.", points: 14740, tests: 98 },
  { rank: 5, name: "Kabir T.", points: 14180, tests: 92 },
  { rank: 6, name: "You", points: 13690, tests: 85 },
  { rank: 7, name: "Zoya A.", points: 13150, tests: 81 },
  { rank: 8, name: "Rudra V.", points: 12740, tests: 77 },
  { rank: 9, name: "Meher J.", points: 12190, tests: 72 },
  { rank: 10, name: "Armaan K.", points: 11710, tests: 69 },
  { rank: 11, name: "Pari D.", points: 11280, tests: 64 },
  { rank: 12, name: "Samar L.", points: 10920, tests: 61 }
];

export const resources: ResourceItem[] = [
  {
    title: "JEE 90-Day Master Roadmap",
    type: "PDF",
    size: "1.2 MB",
    subject: "Mathematics",
    category: "Roadmaps",
    preview: "Week-by-week roadmap for full syllabus completion and spaced revisions.",
    href: "#"
  },
  {
    title: "Last 30 Days Strategy Playbook",
    type: "PDF",
    size: "980 KB",
    subject: "Physics",
    category: "Strategies",
    preview: "Daily strategy blocks for mocks, analysis, and high-retention revision loops.",
    href: "#"
  },
  {
    title: "Organic Chemistry Rapid Notes",
    type: "PDF",
    size: "2.2 MB",
    subject: "Chemistry",
    category: "Notes",
    preview: "Named reactions, mechanisms, and conversion maps in concise memory format.",
    href: "#"
  },
  {
    title: "Physics Formula Sheet",
    type: "PDF",
    size: "1.4 MB",
    subject: "Physics",
    category: "Notes",
    preview: "High-frequency formulas from mechanics, optics, modern physics, and electrostatics.",
    href: "#"
  },
  {
    title: "Best Books by Chapter Priority",
    type: "PDF",
    size: "1.1 MB",
    subject: "Mathematics",
    category: "Books",
    preview: "Recommended books chapter-wise with easy, medium, and hard progression sequence.",
    href: "#"
  },
  {
    title: "Top 300 Mixed Problems",
    type: "PDF",
    size: "2.0 MB",
    subject: "Mathematics",
    category: "Problems",
    preview: "Curated mixed-level problems with time targets and solving approach hints.",
    href: "#"
  },
  {
    title: "JEE Main PYQ Pack (2019-2025)",
    type: "PDF",
    size: "4.8 MB",
    subject: "Physics",
    category: "PYQs",
    preview: "Chapter-sorted PYQs with attempt order recommendations and trend analysis.",
    href: "#"
  },
  {
    title: "JEE Advanced PYQ Matrix",
    type: "PDF",
    size: "3.9 MB",
    subject: "Chemistry",
    category: "PYQs",
    preview: "Question matrix by topic and difficulty with pattern insights from recent years.",
    href: "#"
  },
  {
    title: "Physics Revision Sprint Roadmap",
    type: "PDF",
    size: "1.0 MB",
    subject: "Physics",
    category: "Roadmaps",
    preview: "Fast-track roadmap to revise complete physics in structured weekly blocks.",
    href: "#"
  },
  {
    title: "Exam Hall Time Strategy Sheet",
    type: "PDF",
    size: "720 KB",
    subject: "Mathematics",
    category: "Strategies",
    preview: "High-pressure time strategy for section ordering and smart question selection.",
    href: "#"
  },
  {
    title: "Inorganic Memory Notes",
    type: "PDF",
    size: "1.6 MB",
    subject: "Chemistry",
    category: "Notes",
    preview: "Memory-friendly inorganic chemistry blocks with periodic trend maps.",
    href: "#"
  },
  {
    title: "Physics Problem Marathon Set",
    type: "PDF",
    size: "2.4 MB",
    subject: "Physics",
    category: "Problems",
    preview: "Mixed chapter challenge set designed for speed plus conceptual stability.",
    href: "#"
  },
  {
    title: "Math PYQ Deep Practice Pack",
    type: "PDF",
    size: "3.5 MB",
    subject: "Mathematics",
    category: "PYQs",
    preview: "Year-wise plus chapter-wise math PYQs with difficulty labels and hints.",
    href: "#"
  }
];
