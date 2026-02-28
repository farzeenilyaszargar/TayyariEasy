"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BrainIcon, SendIcon, UserIcon } from "@/components/ui-icons";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ProblemsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) {
      return;
    }

    const userMessage: Message = { role: "user", text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "AI request failed.");
      }

      setMessages((prev) => [...prev, { role: "assistant", text: payload.reply || "No response." }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err instanceof Error ? err.message : "Unable to fetch AI response right now."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleTextChange = (value: string, element: HTMLTextAreaElement) => {
    setInput(value);
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  };

  return (
    <section className={`page problems-center ${messages.length === 0 ? "initial" : "active"}`}>
      <div className="chatbot-shell">
        {messages.length > 0 ? (
          <div className="chat-window chat-window-premium">
            {messages.map((message, idx) => (
              <div key={`${message.role}-${idx}`} className={`chat-row ${message.role}`}>
                <span className="chat-role-icon">
                  {message.role === "assistant" ? <BrainIcon size={14} /> : <UserIcon size={14} />}
                </span>
                <div className={`chat-bubble ${message.role}`}>{message.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="initial-prompt-head">
            <p className="eyebrow">Problems Chat</p>
            <h1>Ask Any Concept or Numerical Problem</h1>
          </div>
        )}
        {messages.length === 0 ? (
          <form className="chat-form chat-form-initial" onSubmit={onSubmit}>
            <textarea
              value={input}
              rows={1}
              onChange={(event) => handleTextChange(event.target.value, event.currentTarget)}
              placeholder="Example: Explain why SN1 reaction prefers polar protic solvent"
            />
            <button className="btn btn-solid send-btn" type="submit" aria-label="Send prompt" disabled={loading}>
              <SendIcon size={16} />
            </button>
          </form>
        ) : null}
      </div>
      {messages.length > 0 ? (
        <form className="chat-form chat-form-dock" onSubmit={onSubmit}>
          <textarea
            value={input}
            rows={1}
            onChange={(event) => handleTextChange(event.target.value, event.currentTarget)}
            placeholder="Example: Explain why SN1 reaction prefers polar protic solvent"
          />
          <button className="btn btn-solid send-btn" type="submit" aria-label="Send prompt" disabled={loading}>
            <SendIcon size={16} />
          </button>
        </form>
      ) : null}
    </section>
  );
}
