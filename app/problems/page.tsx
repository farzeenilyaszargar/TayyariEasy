"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BrainIcon, SendIcon, UserIcon } from "@/components/ui-icons";
import { Fragment, ReactNode } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<Fragment key={`t-${idx++}`}>{text.slice(last, match.index)}</Fragment>);
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`b-${idx++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={`c-${idx++}`} className="md-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(<Fragment key={`t-${idx++}`}>{text.slice(last)}</Fragment>);
  }

  return nodes;
}

function MarkdownBlock({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const codeRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let last = 0;
  let codeIdx = 0;
  let match: RegExpExecArray | null;

  const pushTextBlocks = (chunk: string, baseKey: string) => {
    const lines = chunk.split("\n");
    const local: ReactNode[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trimEnd();
      if (!line.trim()) {
        continue;
      }

      if (line.startsWith("### ")) {
        local.push(
          <h4 key={`${baseKey}-h3-${i}`} className="md-h3">
            {renderInline(line.slice(4))}
          </h4>
        );
        continue;
      }

      if (line.startsWith("## ")) {
        local.push(
          <h3 key={`${baseKey}-h2-${i}`} className="md-h2">
            {renderInline(line.slice(3))}
          </h3>
        );
        continue;
      }

      if (line.startsWith("# ")) {
        local.push(
          <h2 key={`${baseKey}-h1-${i}`} className="md-h1">
            {renderInline(line.slice(2))}
          </h2>
        );
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items: string[] = [line.replace(/^[-*]\s+/, "")];
        while (i + 1 < lines.length && /^[-*]\s+/.test(lines[i + 1].trimEnd())) {
          i += 1;
          items.push(lines[i].trimEnd().replace(/^[-*]\s+/, ""));
        }
        local.push(
          <ul key={`${baseKey}-ul-${i}`} className="md-list">
            {items.map((item, idx) => (
              <li key={`${baseKey}-uli-${i}-${idx}`}>{renderInline(item)}</li>
            ))}
          </ul>
        );
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items: string[] = [line.replace(/^\d+\.\s+/, "")];
        while (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trimEnd())) {
          i += 1;
          items.push(lines[i].trimEnd().replace(/^\d+\.\s+/, ""));
        }
        local.push(
          <ol key={`${baseKey}-ol-${i}`} className="md-list md-ordered">
            {items.map((item, idx) => (
              <li key={`${baseKey}-oli-${i}-${idx}`}>{renderInline(item)}</li>
            ))}
          </ol>
        );
        continue;
      }

      local.push(
        <p key={`${baseKey}-p-${i}`} className="md-p">
          {renderInline(line)}
        </p>
      );
    }

    blocks.push(...local);
  };

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > last) {
      pushTextBlocks(text.slice(last, match.index), `txt-${codeIdx}`);
    }

    const lang = match[1] || "text";
    const code = (match[2] || "").trimEnd();
    blocks.push(
      <pre key={`code-${codeIdx++}`} className="md-code-block">
        <span className="md-code-lang">{lang}</span>
        <code>{code}</code>
      </pre>
    );

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    pushTextBlocks(text.slice(last), `txt-${codeIdx}-tail`);
  }

  return <div className="md-content">{blocks}</div>;
}

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
                <div className={`chat-bubble ${message.role}`}>
                  {message.role === "assistant" ? <MarkdownBlock text={message.text} /> : message.text}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="chat-row assistant">
                <span className="chat-role-icon">
                  <BrainIcon size={14} />
                </span>
                <div className="chat-bubble assistant chat-thinking">Thinking...</div>
              </div>
            ) : null}
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
