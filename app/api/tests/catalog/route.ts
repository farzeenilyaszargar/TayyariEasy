import { NextRequest, NextResponse } from "next/server";
import { LOCAL_TEST_BLUEPRINT } from "@/lib/local-test";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ items: [LOCAL_TEST_BLUEPRINT] });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load test catalog."
      },
      { status: 500 }
    );
  }
}
