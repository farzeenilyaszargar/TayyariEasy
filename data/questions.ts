import type { Question } from "@/lib/types";

// Sample question bank. Replace with the real bank (Supabase `questions` table) later.
export const QUESTIONS: Question[] = [
  // ---------- Physics ----------
  {
    id: "p1", subject: "Physics", chapter: "Kinematics", difficulty: "easy", type: "mcq",
    text: "A ball is thrown vertically upward with a speed of 20 m/s. Taking g = 10 m/s², the maximum height reached is:",
    options: ["10 m", "20 m", "30 m", "40 m"], answer: 1,
    solution: "H = u²/2g = 400/20 = 20 m.", idealTimeSec: 60,
  },
  {
    id: "p2", subject: "Physics", chapter: "Kinematics", difficulty: "easy", type: "mcq",
    text: "A projectile is launched at 45° with a speed of 20 m/s (g = 10 m/s²). Its horizontal range is:",
    options: ["20 m", "40 m", "40√2 m", "80 m"], answer: 1,
    solution: "R = u² sin2θ / g = 400 × 1 / 10 = 40 m.", idealTimeSec: 60,
  },
  {
    id: "p3", subject: "Physics", chapter: "Laws of Motion", difficulty: "medium", type: "mcq",
    text: "Blocks of mass 2 kg and 3 kg are in contact on a frictionless floor. A 10 N horizontal force pushes the 2 kg block. The contact force between the blocks is:",
    options: ["4 N", "5 N", "6 N", "10 N"], answer: 2,
    solution: "a = 10/5 = 2 m/s². Force on the 3 kg block = 3 × 2 = 6 N.", idealTimeSec: 90,
  },
  {
    id: "p4", subject: "Physics", chapter: "Work, Energy & Power", difficulty: "easy", type: "mcq",
    text: "A spring of spring constant 200 N/m is compressed by 0.1 m. The elastic potential energy stored is:",
    options: ["0.5 J", "1 J", "2 J", "10 J"], answer: 1,
    solution: "U = ½kx² = ½ × 200 × 0.01 = 1 J.", idealTimeSec: 45,
  },
  {
    id: "p5", subject: "Physics", chapter: "Rotational Motion", difficulty: "medium", type: "mcq",
    text: "The moment of inertia of a thin uniform ring of mass M and radius R about its diameter is:",
    options: ["MR²", "MR²/2", "2MR²", "MR²/4"], answer: 1,
    solution: "I(axis) = MR². By the perpendicular axis theorem, I(diameter) = MR²/2.", idealTimeSec: 60,
  },
  {
    id: "p6", subject: "Physics", chapter: "Gravitation", difficulty: "hard", type: "mcq",
    text: "Escape velocity on Earth is 11.2 km/s. For a planet with the same density but twice Earth's radius, escape velocity is:",
    options: ["5.6 km/s", "11.2 km/s", "15.8 km/s", "22.4 km/s"], answer: 3,
    solution: "vₑ = √(2GM/R) ∝ R√ρ. Doubling R with same ρ doubles vₑ → 22.4 km/s.", idealTimeSec: 120,
  },
  {
    id: "p7", subject: "Physics", chapter: "Electrostatics", difficulty: "easy", type: "mcq",
    text: "Two point charges of 1 μC each are placed 1 m apart in vacuum. The force between them is:",
    options: ["9 × 10⁻³ N", "9 × 10⁻⁶ N", "9 × 10³ N", "9 N"], answer: 0,
    solution: "F = kq₁q₂/r² = 9×10⁹ × 10⁻¹² / 1 = 9×10⁻³ N.", idealTimeSec: 60,
  },
  {
    id: "p8", subject: "Physics", chapter: "Current Electricity", difficulty: "medium", type: "mcq",
    text: "Two 6 Ω resistors are connected in parallel, and this combination is connected in series with another 6 Ω resistor. The equivalent resistance is:",
    options: ["2 Ω", "9 Ω", "12 Ω", "18 Ω"], answer: 1,
    solution: "6 ∥ 6 = 3 Ω; 3 + 6 = 9 Ω.", idealTimeSec: 60,
  },
  {
    id: "p9", subject: "Physics", chapter: "Ray Optics", difficulty: "medium", type: "mcq",
    text: "An object is placed 30 cm in front of a convex lens of focal length 20 cm. The image is formed at:",
    options: ["12 cm, same side", "60 cm, other side", "60 cm, same side", "20 cm, other side"], answer: 1,
    solution: "1/v − 1/u = 1/f with u = −30: 1/v = 1/20 − 1/30 = 1/60 → v = +60 cm (real, other side).", idealTimeSec: 90,
  },
  {
    id: "p10", subject: "Physics", chapter: "Modern Physics", difficulty: "easy", type: "numerical",
    text: "Energy (in eV) of a photon of wavelength 620 nm is: (use hc = 1240 eV·nm)",
    answer: 2, solution: "E = 1240/620 = 2 eV.", idealTimeSec: 60,
  },
  {
    id: "p11", subject: "Physics", chapter: "Oscillations", difficulty: "medium", type: "numerical",
    text: "Time period (in seconds) of a simple pendulum of length 1 m at a place where g = π² m/s² is:",
    answer: 2, solution: "T = 2π√(L/g) = 2π√(1/π²) = 2 s.", idealTimeSec: 60,
  },
  {
    id: "p12", subject: "Physics", chapter: "Thermodynamics", difficulty: "medium", type: "numerical",
    text: "Efficiency (in %) of a Carnot engine operating between 500 K and 300 K is:",
    answer: 40, solution: "η = 1 − T₂/T₁ = 1 − 300/500 = 0.4 = 40%.", idealTimeSec: 60,
  },

  // ---------- Chemistry ----------
  {
    id: "c1", subject: "Chemistry", chapter: "Mole Concept", difficulty: "easy", type: "numerical",
    text: "Mass (in g) of 0.5 mol of H₂SO₄ (molar mass 98 g/mol) is:",
    answer: 49, solution: "m = n × M = 0.5 × 98 = 49 g.", idealTimeSec: 45,
  },
  {
    id: "c2", subject: "Chemistry", chapter: "Atomic Structure", difficulty: "easy", type: "mcq",
    text: "Maximum number of electrons that can be accommodated in the shell with n = 3 is:",
    options: ["8", "9", "18", "32"], answer: 2,
    solution: "Max electrons = 2n² = 18.", idealTimeSec: 30,
  },
  {
    id: "c3", subject: "Chemistry", chapter: "Periodic Table", difficulty: "easy", type: "mcq",
    text: "Which element has the highest electronegativity?",
    options: ["Oxygen", "Fluorine", "Chlorine", "Nitrogen"], answer: 1,
    solution: "Fluorine is the most electronegative element (3.98 on the Pauling scale).", idealTimeSec: 30,
  },
  {
    id: "c4", subject: "Chemistry", chapter: "Chemical Bonding", difficulty: "easy", type: "mcq",
    text: "Hybridisation of the carbon atom in CO₂ is:",
    options: ["sp", "sp²", "sp³", "sp³d"], answer: 0,
    solution: "CO₂ is linear with two σ bonds on carbon → sp.", idealTimeSec: 45,
  },
  {
    id: "c5", subject: "Chemistry", chapter: "Chemical Bonding", difficulty: "medium", type: "mcq",
    text: "The shape of the NH₃ molecule is:",
    options: ["Trigonal planar", "Tetrahedral", "Trigonal pyramidal", "T-shaped"], answer: 2,
    solution: "3 bond pairs + 1 lone pair (sp³) → trigonal pyramidal.", idealTimeSec: 45,
  },
  {
    id: "c6", subject: "Chemistry", chapter: "Ionic Equilibrium", difficulty: "easy", type: "numerical",
    text: "pH of a 0.001 M HCl solution is:",
    answer: 3, solution: "[H⁺] = 10⁻³ → pH = 3.", idealTimeSec: 45,
  },
  {
    id: "c7", subject: "Chemistry", chapter: "Thermodynamics", difficulty: "medium", type: "mcq",
    text: "For a process to be spontaneous at constant temperature and pressure:",
    options: ["ΔG > 0", "ΔG < 0", "ΔH > 0", "ΔS < 0"], answer: 1,
    solution: "Spontaneity at constant T, P requires ΔG < 0.", idealTimeSec: 45,
  },
  {
    id: "c8", subject: "Chemistry", chapter: "Electrochemistry", difficulty: "medium", type: "mcq",
    text: "Charge required to deposit 1 mol of Cu from Cu²⁺ solution is approximately:",
    options: ["96500 C", "48250 C", "193000 C", "289500 C"], answer: 2,
    solution: "Cu²⁺ + 2e⁻ → Cu requires 2F = 2 × 96500 = 193000 C.", idealTimeSec: 60,
  },
  {
    id: "c9", subject: "Chemistry", chapter: "Organic Basics", difficulty: "easy", type: "mcq",
    text: "IUPAC name of CH₃–CH(CH₃)–CH₃ is:",
    options: ["Butane", "2-Methylpropane", "1-Methylpropane", "Isobutene"], answer: 1,
    solution: "Longest chain has 3 carbons with a methyl at C-2 → 2-methylpropane.", idealTimeSec: 45,
  },
  {
    id: "c10", subject: "Chemistry", chapter: "Organic Basics", difficulty: "medium", type: "mcq",
    text: "Which of the following is the most acidic?",
    options: ["Ethanol", "Water", "Phenol", "Acetic acid"], answer: 3,
    solution: "Acetate ion is resonance-stabilised over two oxygens; acetic acid (pKa ≈ 4.8) is more acidic than phenol (≈10).", idealTimeSec: 60,
  },
  {
    id: "c11", subject: "Chemistry", chapter: "Haloalkanes", difficulty: "hard", type: "mcq",
    text: "Which alkyl halide undergoes SN1 reaction fastest?",
    options: ["CH₃Br", "CH₃CH₂Br", "(CH₃)₂CHBr", "(CH₃)₃CBr"], answer: 3,
    solution: "SN1 rate depends on carbocation stability; tertiary carbocation is most stable.", idealTimeSec: 60,
  },
  {
    id: "c12", subject: "Chemistry", chapter: "Coordination Compounds", difficulty: "medium", type: "numerical",
    text: "Oxidation state of Fe in K₄[Fe(CN)₆] is:",
    answer: 2, solution: "4(+1) + x + 6(−1) = 0 → x = +2.", idealTimeSec: 45,
  },

  // ---------- Mathematics ----------
  {
    id: "m1", subject: "Mathematics", chapter: "Quadratic Equations", difficulty: "easy", type: "mcq",
    text: "Sum of the roots of 2x² − 6x + 3 = 0 is:",
    options: ["−3", "3", "3/2", "6"], answer: 1,
    solution: "Sum = −b/a = 6/2 = 3.", idealTimeSec: 30,
  },
  {
    id: "m2", subject: "Mathematics", chapter: "Complex Numbers", difficulty: "easy", type: "mcq",
    text: "The modulus of 3 + 4i is:",
    options: ["5", "7", "1", "25"], answer: 0,
    solution: "|z| = √(9 + 16) = 5.", idealTimeSec: 30,
  },
  {
    id: "m3", subject: "Mathematics", chapter: "Sequences & Series", difficulty: "easy", type: "numerical",
    text: "Sum of the first 20 terms of the AP 1, 3, 5, 7, … is:",
    answer: 400, solution: "Sum of first n odd numbers = n² = 400.", idealTimeSec: 60,
  },
  {
    id: "m4", subject: "Mathematics", chapter: "Binomial Theorem", difficulty: "easy", type: "mcq",
    text: "Coefficient of x² in the expansion of (1 + x)⁵ is:",
    options: ["5", "10", "15", "20"], answer: 1,
    solution: "⁵C₂ = 10.", idealTimeSec: 45,
  },
  {
    id: "m5", subject: "Mathematics", chapter: "Permutations & Combinations", difficulty: "medium", type: "numerical",
    text: "Number of distinct arrangements of the letters of the word LEVEL is:",
    answer: 30, solution: "5!/(2! 2!) = 120/4 = 30.", idealTimeSec: 90,
  },
  {
    id: "m6", subject: "Mathematics", chapter: "Limits", difficulty: "easy", type: "mcq",
    text: "lim (x→0) sin(3x)/x equals:",
    options: ["0", "1", "3", "1/3"], answer: 2,
    solution: "sin(3x)/x = 3 · sin(3x)/(3x) → 3.", idealTimeSec: 45,
  },
  {
    id: "m7", subject: "Mathematics", chapter: "Differentiation", difficulty: "medium", type: "mcq",
    text: "The derivative of x²eˣ at x = 1 is:",
    options: ["e", "2e", "3e", "e²"], answer: 2,
    solution: "d/dx = 2x eˣ + x² eˣ; at x = 1: 2e + e = 3e.", idealTimeSec: 60,
  },
  {
    id: "m8", subject: "Mathematics", chapter: "Integration", difficulty: "easy", type: "mcq",
    text: "∫₀¹ x² dx equals:",
    options: ["1/2", "1/3", "1", "2/3"], answer: 1,
    solution: "[x³/3]₀¹ = 1/3.", idealTimeSec: 30,
  },
  {
    id: "m9", subject: "Mathematics", chapter: "Straight Lines", difficulty: "easy", type: "mcq",
    text: "Distance between the points (1, 2) and (4, 6) is:",
    options: ["3", "4", "5", "7"], answer: 2,
    solution: "√(3² + 4²) = 5.", idealTimeSec: 30,
  },
  {
    id: "m10", subject: "Mathematics", chapter: "Circles", difficulty: "medium", type: "mcq",
    text: "Radius of the circle x² + y² − 4x + 6y − 12 = 0 is:",
    options: ["3", "5", "√13", "25"], answer: 1,
    solution: "Centre (2, −3); r² = 4 + 9 + 12 = 25 → r = 5.", idealTimeSec: 60,
  },
  {
    id: "m11", subject: "Mathematics", chapter: "Probability", difficulty: "medium", type: "mcq",
    text: "Two fair dice are thrown. The probability that the sum is 7 is:",
    options: ["1/6", "1/12", "5/36", "7/36"], answer: 0,
    solution: "Favourable: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6/36 = 1/6.", idealTimeSec: 60,
  },
  {
    id: "m12", subject: "Mathematics", chapter: "Vectors", difficulty: "hard", type: "numerical",
    text: "If a = i + 2j + 3k and b = 4i − 5j + 6k, then a · b equals:",
    answer: 12, solution: "4 − 10 + 18 = 12.", idealTimeSec: 45,
  },
];

export const QUESTION_MAP: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);
