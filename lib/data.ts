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
  category: "Roadmaps" | "Strategies" | "Notes" | "Books" | "PYQs";
  preview: string;
  checklist?: string[];
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
    title: "JEE 90-Day Master Roadmap (Math)",
    type: "Article",
    size: "8 min read",
    subject: "Mathematics",
    category: "Roadmaps",
    preview:
      "A week-by-week completion checklist to finish core Mathematics chapters with revision cycles and test slots.",
    checklist: ["Weeks 1-3: Algebra + Sequence", "Weeks 4-6: Calculus Core", "Weeks 7-9: Coordinate + Revision"],
    href: "#"
  },
  {
    title: "Last 30 Days Score Improvement Strategy",
    type: "Article",
    size: "7 min read",
    subject: "Physics",
    category: "Strategies",
    preview:
      "A practical daily plan to improve marks in the final month with mock scheduling, analysis windows, and revision priorities.",
    checklist: ["Daily 1 mock block", "90-minute error log review", "Night revision of weak topics"],
    href: "#"
  },
  {
    title: "JEE Main 120-Day Complete Physics Roadmap",
    type: "Article",
    size: "9 min read",
    subject: "Physics",
    category: "Roadmaps",
    preview: "A chapter-priority roadmap for mechanics, electrodynamics, and modern physics with built-in mock checkpoints.",
    checklist: ["Month 1: Mechanics core", "Month 2: Waves + Thermo", "Month 3: Electro + Magnetism", "Month 4: Modern + mocks"],
    href: "#"
  },
  {
    title: "Chemistry NCERT-to-Advanced Coverage Roadmap",
    type: "Article",
    size: "8 min read",
    subject: "Chemistry",
    category: "Roadmaps",
    preview: "A progressive roadmap to complete inorganic, organic, and physical chemistry without losing revision continuity.",
    checklist: ["NCERT line-by-line pass", "Topic-wise PYQ blocks", "Reaction mapping every weekend"],
    href: "#"
  },
  {
    title: "45-Day Calculus Finish Plan",
    type: "Article",
    size: "6 min read",
    subject: "Mathematics",
    category: "Roadmaps",
    preview: "A focused, low-friction plan to finish high-yield calculus chapters with daily problem targets and recap loops.",
    checklist: ["Limits + continuity", "Differentiation + AOD", "Integration + differential equations"],
    href: "#"
  },
  {
    title: "2-Mock-Per-Week Execution Strategy",
    type: "Article",
    size: "6 min read",
    subject: "Physics",
    category: "Strategies",
    preview: "How to structure two full tests weekly and use post-test diagnostics to gain marks within 3-4 weeks.",
    checklist: ["Mock day + analysis day", "Error buckets by chapter", "Retest weak chapter in 72 hours"],
    href: "#"
  },
  {
    title: "Negative Marking Control Strategy",
    type: "Article",
    size: "5 min read",
    subject: "Chemistry",
    category: "Strategies",
    preview: "A decision framework to skip trap questions early and protect your score under pressure.",
    checklist: ["Confidence threshold rule", "60-second abandon trigger", "Final-pass sanity scan"],
    href: "#"
  },
  {
    title: "Morning vs Night Study Strategy for JEE",
    type: "Article",
    size: "5 min read",
    subject: "Mathematics",
    category: "Strategies",
    preview: "Choose a study rhythm based on focus quality and keep consistency high using fixed test and revision windows.",
    checklist: ["Peak-focus block for hard topics", "Low-focus slot for revision", "Daily fixed practice trigger"],
    href: "#"
  },
  {
    title: "Zero-to-80 in Physical Chemistry Strategy",
    type: "Article",
    size: "7 min read",
    subject: "Chemistry",
    category: "Strategies",
    preview: "A practical scoring strategy for mole concept, equilibrium, and electrochemistry with formula retention techniques.",
    checklist: ["Formula bank by chapter", "Numerical drill sets", "Error journal for calculation slips"],
    href: "#"
  },
  {
    title: "JEE Advanced Revision Roadmap (Final 6 Weeks)",
    type: "Article",
    size: "8 min read",
    subject: "Physics",
    category: "Roadmaps",
    preview: "A high-intensity roadmap balancing concept refresh, mixed-question sets, and previous-year papers.",
    checklist: ["Week 1-2: Concept map rebuild", "Week 3-4: Mixed advanced sets", "Week 5-6: Full advanced simulations"],
    href: "#"
  },
  {
    title: "Algebra Completion Roadmap (Starter to Strong)",
    type: "Article",
    size: "7 min read",
    subject: "Mathematics",
    category: "Roadmaps",
    preview: "A clean algebra completion sequence covering quadratic, complex numbers, and permutations with milestone tests.",
    checklist: ["Quadratic + sequence base", "Complex + binomial", "PnC + probability + recap test"],
    href: "#"
  },
  {
    title: "Test-Day Calm and Focus Strategy",
    type: "Article",
    size: "4 min read",
    subject: "Physics",
    category: "Strategies",
    preview: "A repeatable routine for the final 24 hours before exam to reduce panic and keep performance stable.",
    checklist: ["No new chapters after T-24", "Formula + error log only", "Controlled sleep and warm-up questions"],
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
    type: "Article",
    size: "6 min read",
    subject: "Physics",
    category: "Roadmaps",
    preview:
      "A compact roadmap to complete high-yield Physics revision with chapter sequencing and timed practice milestones.",
    checklist: ["Mechanics + Modern Physics first", "2-day formula revision loops", "Full test after each sprint"],
    href: "#"
  },
  {
    title: "Exam Hall Time Management Strategy",
    type: "Article",
    size: "5 min read",
    subject: "Mathematics",
    category: "Strategies",
    preview:
      "A clear section-order and timing framework to maximize score under pressure and avoid negative-marking traps.",
    checklist: ["Round 1: sure-shot questions", "Round 2: medium confidence", "Last 20 mins: review + marked doubts"],
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
    title: "Math PYQ Deep Practice Pack",
    type: "PDF",
    size: "3.5 MB",
    subject: "Mathematics",
    category: "PYQs",
    preview: "Year-wise plus chapter-wise math PYQs with difficulty labels and hints.",
    href: "#"
  }
];
