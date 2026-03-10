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
  roadmapChecklist?: RoadmapSection[];
  longformSections?: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  href: string;
};

export type ArticleResource = ResourceItem & { type: "Article" };

export type RoadmapSection = {
  title: string;
  subtopics: Array<{
    title: string;
    highWeight?: boolean;
  }>;
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
    roadmapChecklist: [
      {
        title: "Algebra Core",
        subtopics: [
          { title: "Quadratic Equations", highWeight: true },
          { title: "Sequences & Series", highWeight: true },
          { title: "Complex Numbers", highWeight: true },
          { title: "Binomial Theorem" },
          { title: "Permutations & Combinations", highWeight: true },
          { title: "Probability", highWeight: true }
        ]
      },
      {
        title: "Calculus Core",
        subtopics: [
          { title: "Limits & Continuity", highWeight: true },
          { title: "Differentiability" },
          { title: "Application of Derivatives", highWeight: true },
          { title: "Indefinite & Definite Integrals", highWeight: true },
          { title: "Differential Equations", highWeight: true }
        ]
      },
      {
        title: "Coordinate Geometry",
        subtopics: [
          { title: "Straight Line", highWeight: true },
          { title: "Circle", highWeight: true },
          { title: "Parabola" },
          { title: "Ellipse" },
          { title: "Hyperbola" }
        ]
      },
      {
        title: "Vectors + 3D",
        subtopics: [
          { title: "Vector Algebra", highWeight: true },
          { title: "3D Geometry", highWeight: true }
        ]
      },
      {
        title: "Matrices & Determinants",
        subtopics: [
          { title: "Matrices Basics" },
          { title: "Determinants", highWeight: true },
          { title: "Linear Equations", highWeight: true }
        ]
      }
    ],
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
    roadmapChecklist: [
      {
        title: "Mechanics Core",
        subtopics: [
          { title: "Kinematics", highWeight: true },
          { title: "Laws of Motion", highWeight: true },
          { title: "Work, Energy & Power", highWeight: true },
          { title: "Rotational Motion", highWeight: true },
          { title: "Gravitation" }
        ]
      },
      {
        title: "Waves + Thermo",
        subtopics: [
          { title: "SHM", highWeight: true },
          { title: "Waves" },
          { title: "Thermal Properties of Matter" },
          { title: "Thermodynamics", highWeight: true },
          { title: "Kinetic Theory of Gases" }
        ]
      },
      {
        title: "Electro + Magnetism",
        subtopics: [
          { title: "Electrostatics", highWeight: true },
          { title: "Current Electricity", highWeight: true },
          { title: "Magnetism", highWeight: true },
          { title: "Electromagnetic Induction", highWeight: true },
          { title: "AC Circuits" }
        ]
      },
      {
        title: "Optics",
        subtopics: [
          { title: "Ray Optics", highWeight: true },
          { title: "Wave Optics", highWeight: true }
        ]
      },
      {
        title: "Modern Physics",
        subtopics: [
          { title: "Photoelectric Effect", highWeight: true },
          { title: "Atomic & Nuclear Physics", highWeight: true },
          { title: "Semiconductors", highWeight: true }
        ]
      }
    ],
    href: "#"
  },
  {
    title: "Chemistry NCERT-to-Advanced Coverage Roadmap",
    type: "Article",
    size: "8 min read",
    subject: "Chemistry",
    category: "Roadmaps",
    preview: "A progressive roadmap to complete inorganic, organic, and physical chemistry without losing revision continuity.",
    roadmapChecklist: [
      {
        title: "Physical Chemistry",
        subtopics: [
          { title: "Mole Concept", highWeight: true },
          { title: "Thermodynamics", highWeight: true },
          { title: "Chemical Equilibrium", highWeight: true },
          { title: "Ionic Equilibrium", highWeight: true },
          { title: "Electrochemistry", highWeight: true },
          { title: "Chemical Kinetics", highWeight: true }
        ]
      },
      {
        title: "Organic Chemistry",
        subtopics: [
          { title: "GOC + Isomerism", highWeight: true },
          { title: "Hydrocarbons" },
          { title: "Haloalkanes & Haloarenes" },
          { title: "Alcohols, Phenols & Ethers", highWeight: true },
          { title: "Aldehydes, Ketones & Acids", highWeight: true },
          { title: "Amines", highWeight: true }
        ]
      },
      {
        title: "Inorganic Chemistry",
        subtopics: [
          { title: "Chemical Bonding", highWeight: true },
          { title: "Coordination Compounds", highWeight: true },
          { title: "Periodic Table & Trends" },
          { title: "p-Block", highWeight: true },
          { title: "d-Block & f-Block" }
        ]
      }
    ],
    href: "#"
  },
  {
    title: "45-Day Calculus Finish Plan",
    type: "Article",
    size: "6 min read",
    subject: "Mathematics",
    category: "Roadmaps",
    preview: "A focused, low-friction plan to finish high-yield calculus chapters with daily problem targets and recap loops.",
    roadmapChecklist: [
      {
        title: "Limits to AOD",
        subtopics: [
          { title: "Limits & Continuity", highWeight: true },
          { title: "Differentiability" },
          { title: "Application of Derivatives", highWeight: true },
          { title: "Tangents & Normals" }
        ]
      },
      {
        title: "Integration",
        subtopics: [
          { title: "Indefinite Integration", highWeight: true },
          { title: "Definite Integration", highWeight: true },
          { title: "Area Under Curve", highWeight: true }
        ]
      },
      {
        title: "Differential Equations",
        subtopics: [
          { title: "Order & Degree Basics" },
          { title: "Solution Methods", highWeight: true },
          { title: "Applications", highWeight: true }
        ]
      }
    ],
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
    roadmapChecklist: [
      {
        title: "Revision Block 1",
        subtopics: [
          { title: "Mechanics Revision", highWeight: true },
          { title: "Electrostatics + Current", highWeight: true },
          { title: "Magnetism + EMI", highWeight: true }
        ]
      },
      {
        title: "Revision Block 2",
        subtopics: [
          { title: "Thermo + KTG", highWeight: true },
          { title: "Waves + SHM" },
          { title: "Optics", highWeight: true }
        ]
      },
      {
        title: "Revision Block 3",
        subtopics: [
          { title: "Modern Physics", highWeight: true },
          { title: "Error Log Reattempts", highWeight: true },
          { title: "Full Mixed Mock Tests", highWeight: true }
        ]
      }
    ],
    href: "#"
  },
  {
    title: "Algebra Completion Roadmap (Starter to Strong)",
    type: "Article",
    size: "7 min read",
    subject: "Mathematics",
    category: "Roadmaps",
    preview: "A clean algebra completion sequence covering quadratic, complex numbers, and permutations with milestone tests.",
    roadmapChecklist: [
      {
        title: "Algebra Foundation",
        subtopics: [
          { title: "Quadratic Equations", highWeight: true },
          { title: "Sequences & Series", highWeight: true },
          { title: "Inequalities" }
        ]
      },
      {
        title: "Complex + Binomial",
        subtopics: [
          { title: "Complex Numbers", highWeight: true },
          { title: "Binomial Theorem", highWeight: true },
          { title: "De Moivre Basics" }
        ]
      },
      {
        title: "Counting + Probability",
        subtopics: [
          { title: "Permutations & Combinations", highWeight: true },
          { title: "Probability", highWeight: true }
        ]
      },
      {
        title: "Matrices & Determinants",
        subtopics: [
          { title: "Matrices Basics" },
          { title: "Determinants", highWeight: true },
          { title: "Linear Equations", highWeight: true }
        ]
      }
    ],
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
    roadmapChecklist: [
      {
        title: "Sprint 1",
        subtopics: [
          { title: "Kinematics + NLM", highWeight: true },
          { title: "Work, Energy & Power", highWeight: true },
          { title: "Rotational Motion", highWeight: true }
        ]
      },
      {
        title: "Sprint 2",
        subtopics: [
          { title: "Electrostatics", highWeight: true },
          { title: "Current Electricity", highWeight: true },
          { title: "Magnetism + EMI", highWeight: true }
        ]
      },
      {
        title: "Sprint 3",
        subtopics: [
          { title: "Ray + Wave Optics", highWeight: true },
          { title: "Modern Physics", highWeight: true },
          { title: "Semiconductors", highWeight: true }
        ]
      }
    ],
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

export function slugifyResourceTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getArticleResources(): ArticleResource[] {
  return resources.filter((resource): resource is ArticleResource => resource.type === "Article");
}

export function getArticleBySlug(slug: string): ArticleResource | null {
  const item = getArticleResources().find((resource) => slugifyResourceTitle(resource.title) === slug);
  return item ?? null;
}

function buildLongformSentenceSet(article: ArticleResource, heading: string, index: number) {
  const checklistA = article.checklist?.[0] || "Set chapter targets and weekly checkpoints.";
  const checklistB = article.checklist?.[1] || "Run timed practice and post-test analysis.";
  const checklistC = article.checklist?.[2] || "Review mistakes and retest weak areas quickly.";

  return [
    `In phase ${index + 1} (${heading.toLowerCase()}), start by defining one clear outcome for ${article.subject} that can be measured inside your next two tests.`,
    `Treat this block as a strict execution window where your main objective is to convert preparation time into score stability, not just chapter completion.`,
    `For ${article.title}, keep a visible tracker with date, chapter, question volume, accuracy, and average solve time so progress stays evidence-based.`,
    `Use the first 15 minutes of every study block to reactivate formulas, key definitions, and common traps linked to the topic you are practicing.`,
    `Apply this checklist anchor daily: ${checklistA} This keeps your plan practical and aligned with exam scoring behavior.`,
    `Add a second control rule from your plan: ${checklistB} This ensures every attempt gives feedback you can use immediately.`,
    `Close each day using this recovery loop: ${checklistC} That one loop usually prevents repeat mistakes across the week.`,
    `If execution drops for two consecutive days, reduce content load by twenty percent and redirect that time to error correction and timed re-attempts.`,
    `Your decision quality improves when you label questions as sure, workable, or risky before solving, because that mirrors the pressure of the real paper.`,
    `At the end of this block, compare current metrics with your starting baseline and document one tactical change for the next session.`
  ];
}

export function getLongformSections(article: ArticleResource) {
  if (article.longformSections && article.longformSections.length > 0) {
    return article.longformSections;
  }

  const headings = [
    "Goal Setting and Baseline",
    "Syllabus Prioritization",
    "Concept Consolidation",
    "Timed Practice Design",
    "Mock Test Integration",
    "Error Log Engineering",
    "Accuracy Improvement",
    "Speed and Selection Control",
    "Revision Cycle Planning",
    "Weak Topic Recovery",
    "Exam Simulation Protocol",
    "Energy and Focus Management"
  ];

  return headings.map((heading, index) => {
    const sentences = buildLongformSentenceSet(article, heading, index);
    return {
      heading,
      paragraphs: [
        sentences.slice(0, 4).join(" "),
        sentences.slice(4, 7).join(" "),
        sentences.slice(7).join(" ")
      ]
    };
  });
}
