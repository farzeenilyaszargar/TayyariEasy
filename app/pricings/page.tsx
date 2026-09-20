import type { Metadata } from "next";
import { PricingPlans } from "@/components/pricing-plans";

export const metadata: Metadata = { title: "Pricing", description: "Start free with one JEE mock each week or unlock Tayyari Pro for ₹199 lifetime." };
export default function PricingsPage() { return <PricingPlans />; }
