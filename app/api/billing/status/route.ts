import { NextRequest, NextResponse } from "next/server";
import { getBillingStatus } from "@/lib/billing";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view your plan." }, { status: 401 });
  try {
    return NextResponse.json(await getBillingStatus(user.id));
  } catch {
    return NextResponse.json({ error: "Plan status is temporarily unavailable." }, { status: 503 });
  }
}
