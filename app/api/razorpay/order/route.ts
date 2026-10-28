import { NextResponse } from "next/server";
import { planById } from "@/lib/plans";
import { createOrder } from "@/lib/razorpay";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { planId } = await request.json().catch(() => ({}));
  const plan = planById(planId);
  if (!plan) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });

  try {
    const order = await createOrder(plan.amountPaise, `tz_${Date.now()}`, { user_id: user.id, plan_id: plan.id });
    const { error } = await supabaseAdmin().from("payments").insert({
      user_id: user.id, razorpay_order_id: order.id, plan_id: plan.id, amount: order.amount, currency: order.currency,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({
      orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID,
      prefill: { email: user.email ?? "", contact: user.phone ?? "" },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
