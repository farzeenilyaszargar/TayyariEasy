import type { Subject, TestPaper } from "@/lib/types";
import { QUESTIONS } from "./questions";

const idsFor = (subject: Subject) => QUESTIONS.filter((q) => q.subject === subject).map((q) => q.id);

export const TESTS: TestPaper[] = [
  {
    id: "jee-main-mock-1",
    title: "JEE Main Full Mock #1",
    kind: "full",
    description: "Full-syllabus mock in JEE Main pattern across Physics, Chemistry and Mathematics.",
    durationMin: 90,
    questionIds: [...idsFor("Physics"), ...idsFor("Chemistry"), ...idsFor("Mathematics")],
    releasedAt: "2026-10-26",
  },
  {
    id: "physics-sectional-1",
    title: "Physics Sectional #1",
    kind: "subject",
    subject: "Physics",
    description: "Mechanics to modern physics, one paper.",
    durationMin: 30,
    questionIds: idsFor("Physics"),
    releasedAt: "2026-10-26",
  },
  {
    id: "chemistry-sectional-1",
    title: "Chemistry Sectional #1",
    kind: "subject",
    subject: "Chemistry",
    description: "Physical, inorganic and organic chemistry mix.",
    durationMin: 30,
    questionIds: idsFor("Chemistry"),
    releasedAt: "2026-10-19",
  },
  {
    id: "maths-sectional-1",
    title: "Mathematics Sectional #1",
    kind: "subject",
    subject: "Mathematics",
    description: "Algebra, calculus and coordinate geometry.",
    durationMin: 30,
    questionIds: idsFor("Mathematics"),
    releasedAt: "2026-10-19",
  },
  {
    id: "mechanics-sprint",
    title: "Mechanics Sprint",
    kind: "chapter",
    subject: "Physics",
    description: "Kinematics, laws of motion, energy, rotation and gravitation.",
    durationMin: 12,
    questionIds: ["p1", "p2", "p3", "p4", "p5", "p6"],
    releasedAt: "2026-10-12",
  },
  {
    id: "bonding-organic-sprint",
    title: "Bonding & Organic Sprint",
    kind: "chapter",
    subject: "Chemistry",
    description: "Chemical bonding, organic basics and haloalkanes.",
    durationMin: 10,
    questionIds: ["c4", "c5", "c9", "c10", "c11"],
    releasedAt: "2026-10-12",
  },
  {
    id: "calculus-sprint",
    title: "Calculus Sprint",
    kind: "chapter",
    subject: "Mathematics",
    description: "Limits, differentiation and integration.",
    durationMin: 6,
    questionIds: ["m6", "m7", "m8"],
    releasedAt: "2026-10-05",
  },
];

export const TEST_MAP: Record<string, TestPaper> = Object.fromEntries(TESTS.map((t) => [t.id, t]));
