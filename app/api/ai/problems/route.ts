import { NextRequest, NextResponse } from "next/server";
import { hasDeepSeekConfig } from "@/lib/deepseek";

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

    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    const deepseekBaseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    const upstream = await fetch(`${deepseekBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekApiKey}`
      },
      body: JSON.stringify({
        model: deepseekModel,
        stream: true,
        temperature: 0.3,
        max_tokens: 700,
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
        ]
      })
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      return NextResponse.json({ error: text || "DeepSeek stream failed." }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith("data:")) {
                continue;
              }

              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                  controller.enqueue(encoder.encode(token));
                }
              } catch {
                continue;
              }
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
