import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { supabaseRest } from "@/lib/supabase-server";

type VerificationBody = { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Please sign in before verifying payment." }, { status: 401 });

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });

  const body = (await request.json()) as VerificationBody;
  const orderId = body.razorpay_order_id?.trim();
  const paymentId = body.razorpay_payment_id?.trim();
  const signature = body.razorpay_signature?.trim();
  if (!orderId || !paymentId || !signature) return NextResponse.json({ error: "Incomplete payment verification data." }, { status: 400 });

  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const valid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });

  try {
    await supabaseRest("user_subscriptions", "POST", [{
      user_id: user.id,
      plan: "pro",
      status: "active",
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      activated_at: new Date().toISOString()
    }], "resolution=merge-duplicates,return=minimal");
    await supabaseRest("payment_events", "POST", [{
      user_id: user.id,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount_paise: 29900,
      currency: "INR",
      status: "captured"
    }], "resolution=merge-duplicates,return=minimal");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment verified but access could not be activated." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: "pro" });
}
