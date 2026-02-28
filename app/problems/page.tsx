"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { MicIcon, SendIcon } from "@/components/ui-icons";
import { Fragment, ReactNode } from "react";
import Script from "next/script";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }

  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
    };
  }
}

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
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const dictationBaseRef = useRef("");
  const inputRef = useRef("");
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
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", text: "" }]);
    setInput("");
    inputRef.current = "";
    setLoading(true);

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
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError("");
      dictationBaseRef.current = inputRef.current;
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      const code = event.error || "unknown";
      if (code === "network") {
        setVoiceError("Voice recognition needs internet access in this browser. Check your connection and try again.");
      } else if (code === "not-allowed" || code === "service-not-allowed") {
        setVoiceError("Microphone permission is blocked. Allow mic access in browser settings.");
      } else if (code === "no-speech") {
        setVoiceError("No speech detected. Try speaking again.");
      } else {
        setVoiceError("Voice input failed. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript ?? "";
      }
      const merged = `${dictationBaseRef.current} ${transcript}`.trim();
      setInput(merged);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

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
    dictationBaseRef.current = value;
    inputRef.current = value;
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

  const toggleVoiceInput = () => {
    if (!voiceSupported) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }

    if (!navigator.onLine) {
      setVoiceError("You appear offline. Connect to the internet and try voice input again.");
      return;
    }

    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }

    setVoiceError("");
    if (isListening) {
      recognition.stop();
      return;
    }
    dictationBaseRef.current = inputRef.current;
    try {
      recognition.start();
    } catch {
      setVoiceError("Could not start microphone capture. Please retry.");
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
            <button
              className={`btn btn-outline voice-btn ${isListening ? "voice-btn-live" : ""}`}
              type="button"
              aria-label="Voice to text"
              onClick={toggleVoiceInput}
            >
              <MicIcon size={16} />
            </button>
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
          <button
            className={`btn btn-outline voice-btn ${isListening ? "voice-btn-live" : ""}`}
            type="button"
            aria-label="Voice to text"
            onClick={toggleVoiceInput}
          >
            <MicIcon size={16} />
          </button>
          <button className="btn btn-solid send-btn" type="submit" aria-label="Send prompt" disabled={loading}>
            <SendIcon size={16} />
          </button>
        </form>
      ) : null}
      {voiceError ? <p className="voice-error">{voiceError}</p> : null}
    </section>
  );
}
