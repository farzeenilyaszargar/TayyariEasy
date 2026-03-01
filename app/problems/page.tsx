"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/ui-icons";
import { Fragment, ReactNode } from "react";
import Script from "next/script";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: WebSource[];
  images?: WebImage[];
  sourcesLoading?: boolean;
};

type WebSource = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

type WebImage = {
  title: string;
  imageUrl: string;
  pageUrl: string;
  source: string;
};

function shouldFetchWebSources(prompt: string) {
  const text = prompt.toLowerCase();
  const nonSearchPatterns = [
    /revision/,
    /study plan/,
    /time table/,
    /timetable/,
    /motivation/,
    /routine/,
    /how should i study/,
    /how to improve rank/,
    /strategy/
  ];
  const isLikelyPlanning = nonSearchPatterns.some((pattern) => pattern.test(text));

  const conceptPatterns = [
    /explain/,
    /derive/,
    /prove/,
    /integration/,
    /reaction/,
    /mechanism/,
    /sn1/,
    /sn2/,
    /equation/,
    /formula/,
    /numerical/,
    /solve/
  ];
  const hasConceptIntent = conceptPatterns.some((pattern) => pattern.test(text));
  if (isLikelyPlanning && !hasConceptIntent) {
    return false;
  }
  return true;
}

declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
    };
  }
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|(?<!\*)\*[^*\n]+\*(?!\*)|_[^_\n]+_|(?<!\S)\/[^/\n]+\/(?!\S))/g;
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
    } else if (token.startsWith("*") || token.startsWith("_")) {
      nodes.push(<em key={`i-${idx++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("/")) {
      nodes.push(<em key={`i2-${idx++}`}>{token.slice(1, -1).trim()}</em>);
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
  const displayMathRegex = /\\\[[\s\S]*?\\\]/g;
  let last = 0;
  let codeIdx = 0;
  let match: RegExpExecArray | null;

  const pushTextBlocks = (chunk: string, baseKey: string) => {
    const segments: Array<{ type: "text" | "math"; value: string }> = [];
    let segmentLast = 0;
    let segmentMatch: RegExpExecArray | null;

    while ((segmentMatch = displayMathRegex.exec(chunk)) !== null) {
      if (segmentMatch.index > segmentLast) {
        segments.push({
          type: "text",
          value: chunk.slice(segmentLast, segmentMatch.index)
        });
      }
      segments.push({
        type: "math",
        value: segmentMatch[0]
      });
      segmentLast = segmentMatch.index + segmentMatch[0].length;
    }
    if (segmentLast < chunk.length) {
      segments.push({
        type: "text",
        value: chunk.slice(segmentLast)
      });
    }

    const local: ReactNode[] = [];
    let lineBase = 0;

    for (const segment of segments) {
      if (segment.type === "math") {
        local.push(
          <div key={`${baseKey}-math-${lineBase++}`} className="md-math-block">
            {segment.value}
          </div>
        );
        continue;
      }

      const lines = segment.value.split("\n");
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i].trimEnd();
        if (!line.trim()) {
          continue;
        }

        if (line.startsWith("### ")) {
          local.push(
            <h4 key={`${baseKey}-h3-${lineBase}-${i}`} className="md-h3">
              {renderInline(line.slice(4))}
            </h4>
          );
          continue;
        }

        if (line.startsWith("## ")) {
          local.push(
            <h3 key={`${baseKey}-h2-${lineBase}-${i}`} className="md-h2">
              {renderInline(line.slice(3))}
            </h3>
          );
          continue;
        }

        if (line.startsWith("# ")) {
          local.push(
            <h2 key={`${baseKey}-h1-${lineBase}-${i}`} className="md-h1">
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
            <ul key={`${baseKey}-ul-${lineBase}-${i}`} className="md-list">
              {items.map((item, idx) => (
                <li key={`${baseKey}-uli-${lineBase}-${i}-${idx}`}>{renderInline(item)}</li>
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
            <ol key={`${baseKey}-ol-${lineBase}-${i}`} className="md-list md-ordered">
              {items.map((item, idx) => (
                <li key={`${baseKey}-oli-${lineBase}-${i}-${idx}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
          continue;
        }

        local.push(
          <p key={`${baseKey}-p-${lineBase}-${i}`} className="md-p">
            {renderInline(line)}
          </p>
        );
      }
      lineBase += 1;
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
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const placeholderExamples = [
    "Doubt: How to improve rank from 15k to 8k in 60 days?",
    "Doubt: Explain why SN1 prefers polar protic solvents.",
    "Doubt: Give a fast method for limits with indeterminate forms.",
    "Doubt: How should I split revision and mocks this week?",
    "Doubt: Solve this kinematics question step-by-step."
  ];

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) {
      return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: prompt };
    const assistantId = crypto.randomUUID();
    const needsWeb = shouldFetchWebSources(prompt);
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", text: "", sources: [], images: [], sourcesLoading: needsWeb }
    ]);
    setInput("");
    setLoading(true);

    const sourcesPromise = needsWeb
      ? fetch("/api/ai/problems/sources", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ prompt })
        })
          .then(async (response) => {
            if (!response.ok) {
              return { results: [], images: [] } as { results: WebSource[]; images: WebImage[] };
            }
            const payload = (await response.json()) as { results?: WebSource[]; images?: WebImage[] };
            return { results: payload.results || [], images: payload.images || [] };
          })
          .catch(() => ({ results: [], images: [] }))
      : Promise.resolve({ results: [] as WebSource[], images: [] as WebImage[] });

    try {
      const response = await fetch("/api/ai/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "AI request failed.");
      }
      if (!response.body) {
        throw new Error("No response stream received.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) {
          continue;
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  text: message.text + chunk
                }
              : message
          )
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                text: err instanceof Error ? err.message : "Unable to fetch AI response right now."
              }
            : message
        )
      );
    } finally {
      const web = await sourcesPromise;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                sources: web.results,
                images: web.images,
                sourcesLoading: false
              }
            : message
        )
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!window.MathJax?.typesetPromise) {
      return;
    }
    void window.MathJax.typesetPromise();
  }, [messages, loading]);

  useEffect(() => {
    const current = placeholderExamples[placeholderIndex];
    const doneTyping = placeholderText === current;
    const doneDeleting = placeholderText.length === 0;

    let delay = 55;
    if (doneTyping && !isDeleting) {
      delay = 1200;
    } else if (isDeleting) {
      delay = 26;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting && !doneTyping) {
        setPlaceholderText(current.slice(0, placeholderText.length + 1));
        return;
      }

      if (!isDeleting && doneTyping) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && !doneDeleting) {
        setPlaceholderText(current.slice(0, placeholderText.length - 1));
        return;
      }

      if (isDeleting && doneDeleting) {
        setIsDeleting(false);
        setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isDeleting, placeholderExamples, placeholderIndex, placeholderText]);

  const handleTextChange = (value: string, element: HTMLTextAreaElement) => {
    setInput(value);
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    // Shift+Enter and Cmd+Enter should create a newline.
    if (event.shiftKey || event.metaKey) {
      return;
    }

    event.preventDefault();
    if (!loading && input.trim()) {
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <section className={`page problems-center ${messages.length === 0 ? "initial" : "active"}`}>
      <Script id="mathjax-config" strategy="beforeInteractive">
        {`window.MathJax = {
          tex: {
            inlineMath: [['\\\\(', '\\\\)']],
            displayMath: [['\\\\[', '\\\\]']]
          },
          svg: {
            fontCache: 'global'
          }
        };`}
      </Script>
      <Script
        id="mathjax-script"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
        strategy="afterInteractive"
      />
      <div className="chatbot-shell">
        {messages.length > 0 ? (
          <div className="chat-window chat-window-premium">
            {messages.map((message) => (
              <div key={message.id} className={`chat-row ${message.role}`}>
                <div className={`chat-bubble ${message.role}`}>
                  {message.role === "assistant" ? <MarkdownBlock text={message.text} /> : message.text}
                  {message.role === "assistant" ? (
                    <div className="chat-web-panel">
                      {(message.sources?.length || 0) > 0 ? (
                        <div className="chat-web-block">
                          <p className="chat-web-title">Web Results</p>
                          <div className="chat-web-results">
                            {message.sources?.map((item) => (
                              <a
                                key={`${message.id}-${item.url}`}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="chat-web-result-card"
                              >
                                <strong>{item.title}</strong>
                                <span>{item.source}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {(message.images?.length || 0) > 0 ? (
                        <div className="chat-web-block">
                          <p className="chat-web-title">Image Results</p>
                          <div className="chat-image-grid">
                            {message.images?.map((item) => (
                              <a
                                key={`${message.id}-${item.imageUrl}`}
                                href={item.pageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="chat-image-card"
                              >
                                <img src={item.imageUrl} alt={item.title} loading="lazy" />
                                <div>
                                  <strong>{item.title}</strong>
                                  <span>{item.source}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {!message.sourcesLoading &&
                      (message.sources?.length || 0) === 0 &&
                      (message.images?.length || 0) === 0 ? (
                        <p className="muted">No external references found for this query.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        ) : (
          <div className="initial-prompt-head">
            <p className="eyebrow">Doubts Chat</p>
            <h1>Ask Any Concept or Numerical Doubt</h1>
          </div>
        )}
        {messages.length === 0 ? (
          <form className="chat-form chat-form-initial" onSubmit={onSubmit}>
            <textarea
              value={input}
              rows={1}
              onChange={(event) => handleTextChange(event.target.value, event.currentTarget)}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholderText || " "}
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
            onKeyDown={handleInputKeyDown}
            placeholder={placeholderText || " "}
          />
          <button className="btn btn-solid send-btn" type="submit" aria-label="Send prompt" disabled={loading}>
            <SendIcon size={16} />
          </button>
        </form>
      ) : null}
    </section>
  );
}
