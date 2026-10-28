import crypto from "node:crypto";

const API = "https://api.razorpay.com/v1";

function auth() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys are not configured");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

export async function createOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string; amount: number; currency: string };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret)
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

// Webhook signature: HMAC_SHA256(raw_body, webhook_secret)
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
