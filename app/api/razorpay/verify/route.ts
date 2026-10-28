import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

// Called by the browser after Razorpay Checkout succeeds.
export async function POST(request: Request) {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (!orderId || !paymentId || !signature || !verifyPaymentSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: payment } = await admin.from("payments").select("user_id").eq("razorpay_order_id", orderId).maybeSingle();
  if (!payment || payment.user_id !== user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const { error } = await admin.rpc("activate_pro", { p_order_id: orderId, p_payment_id: paymentId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
