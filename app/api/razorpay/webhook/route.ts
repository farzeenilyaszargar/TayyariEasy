import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase/server";

// Backup path: activates Pro even if the student closes the tab before /verify runs.
// Configure in Razorpay Dashboard → Webhooks with events: payment.captured, order.paid.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature") ?? "")) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  const event = JSON.parse(raw);
  const payment = event?.payload?.payment?.entity;
  if (["payment.captured", "order.paid"].includes(event.event) && payment?.order_id) {
    const { error } = await supabaseAdmin().rpc("activate_pro", { p_order_id: payment.order_id, p_payment_id: payment.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
