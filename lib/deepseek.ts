import "server-only";

type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatOptions = {
  messages: DeepSeekMessage[];
  temperature?: number;
  maxTokens?: number;
};

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export function hasDeepSeekConfig() {
  return Boolean(DEEPSEEK_API_KEY);
}

export async function deepseekChat(options: ChatOptions) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DeepSeek API key missing. Set DEEPSEEK_API_KEY in .env.local.");
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 600
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "DeepSeek request failed.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("DeepSeek returned empty response.");
  }

  return content;
}
