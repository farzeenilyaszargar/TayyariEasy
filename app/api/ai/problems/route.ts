import { NextRequest, NextResponse } from "next/server";
import { deepseekChat, hasDeepSeekConfig } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    if (!hasDeepSeekConfig()) {
      return NextResponse.json(
        { error: "DeepSeek API key missing. Add DEEPSEEK_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    const reply = await deepseekChat({
      messages: [
        {
          role: "system",
          content:
            "You are a strict but helpful JEE tutor. Solve step-by-step, keep formulas clear, and end with one short revision tip."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      maxTokens: 700
    });

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
