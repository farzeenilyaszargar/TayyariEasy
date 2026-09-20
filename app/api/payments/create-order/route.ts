import { NextRequest, NextResponse } from "next/server";
import { getBillingStatus } from "@/lib/billing";
import { getAuthenticatedUser } from "@/lib/server-auth";

const PRO_PRICE_PAISE = 29900;

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in before upgrading." }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payments are not configured yet. Add the Razorpay keys to deploy checkout." }, { status: 503 });
  }

  const billing = await getBillingStatus(user.id);
  if (billing.plan === "pro") return NextResponse.json({ error: "Your Pro access is already active." }, { status: 409 });

  const receipt = `tayyari_${user.id.replace(/-/g, "").slice(0, 24)}_${Date.now().toString().slice(-8)}`;
  const authorization = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: authorization, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: PRO_PRICE_PAISE,
      currency: "INR",
      receipt,
      notes: { user_id: user.id, plan: "pro_lifetime" }
    }),
    cache: "no-store"
  });

  const payload = (await razorpayResponse.json().catch(() => ({}))) as { id?: string; error?: { description?: string } };
  if (!razorpayResponse.ok || !payload.id) {
    return NextResponse.json({ error: payload.error?.description || "Unable to create a Razorpay order." }, { status: 502 });
  }

  return NextResponse.json({ orderId: payload.id, amount: PRO_PRICE_PAISE, currency: "INR", keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId });
}
