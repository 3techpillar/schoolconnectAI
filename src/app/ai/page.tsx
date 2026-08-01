"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { ArrowLeft, Mic, Send, Sparkles } from "@/components/Icons";
import { LoadingBlock } from "@/components/StatusUI";
import { useAuth } from "@/lib/providers/auth";
import { apiFetch, ApiError } from "@/lib/shared/api-client";

type Metric = { label: string; value: string; tone: string };
type ChatMsg = {
  id: string;
  role: "ai" | "user";
  text: string;
  metrics?: Metric[];
};

const DEFAULT_SUGGESTIONS = [
  "How is my child doing this week?",
  "Any pending homework?",
  "When is the next PTM?",
  "Show fee status",
];

export default function AIPage() {
  const { user, ready, backend } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const childFirst =
    user?.childName?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    "there";

  useEffect(() => {
    if (!ready || !user) return;
    setMessages([
      {
        id: "welcome",
        role: "ai",
        text: `Hi! I'm your school assistant. Ask me anything about ${childFirst}'s school life — attendance, homework, fees, or circulars.`,
      },
    ]);
    setSuggestions([
      `How is ${childFirst} doing this week?`,
      "Any pending homework?",
      "Show fee status",
      "Any circulars?",
    ]);
  }, [ready, user, childFirst]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const ask = async (raw: string) => {
    const message = raw.trim();
    if (!message || sending) return;
    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: message },
    ]);
    setSending(true);

    try {
      if (!backend) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "ai",
            text: "Connect MongoDB (API mode) to get live answers from fees, attendance, and homework.",
          },
        ]);
        return;
      }
      const res = await apiFetch<{
        reply: string;
        metrics?: Metric[];
        suggestions?: string[];
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: res.reply,
          metrics: res.metrics,
        },
      ]);
      if (res.suggestions?.length) setSuggestions(res.suggestions);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reach the assistant",
      );
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  if (!ready) {
    return (
      <PhoneShell title="SchoolConnect AI" subtitle="Always-on">
        <LoadingBlock label="Loading…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      hideNav
      subtitle="Ask anything"
      title="School AI"
      rightSlot={
        <Link href="/" className="icon-btn on-primary" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
      }
    >
      <div className="space-y" style={{ marginBottom: "6.5rem" }}>
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            <p className="text-sm" style={{ margin: 0 }}>
              {m.text}
            </p>
            {m.metrics?.length ? (
              <div className="metrics-3">
                {m.metrics.map((metric) => (
                  <MiniMetric
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    tone={metric.tone}
                  />
                ))}
              </div>
            ) : null}
          </Bubble>
        ))}
        {sending ? (
          <Bubble role="ai">
            <p className="text-sm muted" style={{ margin: 0 }}>
              Thinking…
            </p>
          </Bubble>
        ) : null}
        {error ? (
          <p className="text-xs" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        ) : null}

        <div className="suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="chip"
              disabled={sending}
              onClick={() => void ask(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <div className="composer-inner">
          <Sparkles size={16} className="tone-primary" />
          <input
            placeholder="Ask anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button
            type="button"
            className="icon-btn muted"
            aria-label="Voice"
            style={{ width: 36, height: 36 }}
            disabled
            title="Voice coming soon"
          >
            <Mic size={16} />
          </button>
          <button
            type="submit"
            className="send-btn"
            aria-label="Send"
            disabled={sending || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </PhoneShell>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "ai" | "user";
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="bubble-user">
        <div className="bubble-user-inner">{children}</div>
      </div>
    );
  }
  return (
    <div className="bubble-ai">
      <div className="bubble-ai-avatar">
        <Sparkles size={14} />
      </div>
      <div className="bubble-ai-inner">{children}</div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="metric">
      <p className={`font-bold ${tone}`} style={{ margin: 0, fontSize: "1rem" }}>
        {value}
      </p>
      <p className="text-10 muted" style={{ margin: 0 }}>
        {label}
      </p>
    </div>
  );
}
