export type DemoQuestion = {
  id: string;
  subject: "Physics" | "Chemistry" | "Mathematics";
  prompt: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
};

// Original introductory checks based on NCERT XI concepts, not JEE previous-year questions.
// https://ncert.nic.in/exemplar-problems.php?ln=en
export const DEMO_QUESTION_POOL: DemoQuestion[] = [
  { id: "p-speed", subject: "Physics", prompt: "A student travels 120 m in 20 s at a constant speed. What is the speed?", options: ["4 m/s", "5 m/s", "6 m/s", "8 m/s"], answer: 2, explanation: "Speed = distance ÷ time = 120 ÷ 20 = 6 m/s." },
  { id: "p-accel", subject: "Physics", prompt: "The velocity of a body changes from 5 m/s to 15 m/s in 2 s. What is its average acceleration?", options: ["2 m/s²", "5 m/s²", "10 m/s²", "20 m/s²"], answer: 1, explanation: "Acceleration = change in velocity ÷ time = (15 − 5) ÷ 2 = 5 m/s²." },
  { id: "p-energy", subject: "Physics", prompt: "What is the kinetic energy of a 2 kg object moving at 3 m/s?", options: ["3 J", "6 J", "9 J", "18 J"], answer: 2, explanation: "Kinetic energy = ½mv² = ½ × 2 × 3² = 9 J." },
  { id: "c-protons", subject: "Chemistry", prompt: "How many protons are in a neutral atom with atomic number 11?", options: ["10", "11", "12", "22"], answer: 1, explanation: "The atomic number is the number of protons." },
  { id: "c-moles", subject: "Chemistry", prompt: "How many moles are present in 18 g of water (molar mass 18 g/mol)?", options: ["0.5 mol", "1 mol", "2 mol", "18 mol"], answer: 1, explanation: "Moles = mass ÷ molar mass = 18 ÷ 18 = 1 mol." },
  { id: "c-isotope", subject: "Chemistry", prompt: "Two isotopes of an element have the same number of which particle?", options: ["Neutrons", "Protons", "Nucleons", "Mass units"], answer: 1, explanation: "Isotopes share an atomic number, so they have the same number of protons." },
  { id: "m-quadratic", subject: "Mathematics", prompt: "Which value of x satisfies x² − 5x + 6 = 0?", options: ["1", "2", "4", "5"], answer: 1, explanation: "x² − 5x + 6 = (x − 2)(x − 3), so x = 2 or 3." },
  { id: "m-sequence", subject: "Mathematics", prompt: "What is the 8th term of the arithmetic progression 3, 7, 11, …?", options: ["27", "29", "31", "35"], answer: 2, explanation: "a₈ = 3 + (8 − 1) × 4 = 31." },
  { id: "m-derivative", subject: "Mathematics", prompt: "What is the derivative of x² with respect to x at x = 3?", options: ["3", "6", "9", "12"], answer: 1, explanation: "The derivative is 2x; at x = 3 it equals 6." }
];

export function pickDemoQuestions(): DemoQuestion[] {
  const subjects: DemoQuestion["subject"][] = ["Physics", "Chemistry", "Mathematics"];
  return subjects.flatMap((subject) =>
    DEMO_QUESTION_POOL.filter((question) => question.subject === subject)
      .map((question) => ({ question, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 2)
      .map(({ question }) => question)
  );
}
