import { NextRequest, NextResponse } from "next/server";
import { hasDeepSeekConfig } from "@/lib/deepseek";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      history?: Array<{ role?: string; text?: string }>;
    };
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
    const history = Array.isArray(body.history)
      ? body.history
          .map((item) => ({
            role: item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null,
            text: item?.text?.trim() || ""
          }))
          .filter((item): item is { role: "user" | "assistant"; text: string } => Boolean(item.role) && item.text.length > 0)
          .slice(-12)
      : [];
    const historyMessages = history.map((item) => ({
      role: item.role,
      content: item.text.slice(0, 1800)
    }));

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
              "You are a strict but helpful JEE tutor. Explain clearly and naturally in concise paragraphs, adapting structure to the question (conceptual, numerical, or strategy). Do not force a fixed template or numbered sections unless the user asks. Keep the response complete and concise (generally under 350 words) so it never gets cut off. Use LaTeX only when needed; put key formulas on separate lines in display math blocks like \\[ ... \\]."
          },
          ...historyMessages,
          {
            role: "user",
            content: `Question/Doubt: ${prompt}\n\nImportant: Keep the answer concise, complete, and natural. Do not leave the response unfinished.`
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
        const processEvent = (rawEvent: string) => {
          const dataLines = rawEvent
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim());

          if (dataLines.length === 0) {
            return;
          }

          const data = dataLines.join("\n").trim();
          if (!data || data === "[DONE]") {
            return;
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
            // Ignore malformed SSE chunks and continue.
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            let boundaryIndex = buffer.indexOf("\n\n");
            while (boundaryIndex !== -1) {
              processEvent(buffer.slice(0, boundaryIndex));
              buffer = buffer.slice(boundaryIndex + 2);
              boundaryIndex = buffer.indexOf("\n\n");
            }
          }

          buffer += decoder.decode();
          for (const eventChunk of buffer.split(/\n\n+/)) {
            if (eventChunk.trim()) {
              processEvent(eventChunk);
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
