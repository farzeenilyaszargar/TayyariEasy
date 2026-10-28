// Pro plans. Prices are placeholders until pricing is decided — the server
// always charges what is defined here, never what the browser sends.
export interface ProPlan {
  id: "pro_monthly" | "pro_yearly";
  label: string;
  amountPaise: number;
  periodLabel: string;
  days: number; // must match activate_pro() in the database
}

export const PRO_PLANS: ProPlan[] = [
  { id: "pro_monthly", label: "Monthly", amountPaise: 14900, periodLabel: "/ month", days: 30 },
  { id: "pro_yearly", label: "Yearly", amountPaise: 99900, periodLabel: "/ year", days: 365 },
];

export const planById = (id: string) => PRO_PLANS.find((p) => p.id === id);
export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
