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
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const userMessage: Message = { role: "user", text: input.trim() };
    const botMessage: Message = {
      role: "assistant",
      text: "Solve with first-principles and check units at each step. In full backend mode, this area will include scraped references and confidence score."
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
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
            <button className="btn btn-solid send-btn" type="submit" aria-label="Send prompt">
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
          <button className="btn btn-solid send-btn" type="submit" aria-label="Send prompt">
            <SendIcon size={16} />
          </button>
        </form>
      ) : null}
    </section>
  );
}
