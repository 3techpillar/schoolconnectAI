"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import {
  useSchoolData,
  formatChatTime,
  MESSAGE_KIND_LABEL,
  type MessageKind,
} from "@/lib/providers/school-data";
import { useStudentEngage, REACTION_EMOJIS } from "@/lib/providers/student-engage";
import { addDaysIso, toIsoDate } from "@/lib/shared/dates";
import { ArrowLeft, Send, BookOpen, CalendarCheck, Sparkles } from "@/components/Icons";
import { LoadingBlock } from "@/components/StatusUI";

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const { user } = useAuth();
  const {
    chats,
    getMessages,
    sendMessage,
    markChatRead,
    canPostAsTeacher,
    ready,
    chatError,
    clearChatError,
  } = useSchoolData();
  const { toggleReaction, reactions, completeMission } = useStudentEngage();

  const chat = chats.find((c) => c.id === chatId);
  const messages = getMessages(chatId);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<MessageKind>("text");
  const [subject, setSubject] = useState("Math");
  const [due, setDue] = useState(addDaysIso(toIsoDate(), 2));
  const [reactFor, setReactFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const teacher = canPostAsTeacher(user);

  useEffect(() => {
    if (chatId) {
      markChatRead(chatId);
      completeMission("mission-chat");
    }
  }, [chatId, markChatRead, completeMission]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!ready || !user) {
    return (
      <PhoneShell title="Chat" subtitle="Loading" hideNav>
        <LoadingBlock label="Opening chat…" />
      </PhoneShell>
    );
  }

  if (!chat) {
    return (
      <PhoneShell title="Chat" subtitle="Not found" hideNav>
        <p className="muted text-sm">This chat does not exist.</p>
        <Link href="/chats" className="btn-primary mt-4" style={{ display: "inline-flex", width: "auto", paddingInline: 16 }}>
          Back to chats
        </Link>
      </PhoneShell>
    );
  }

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const payload = text;
    setSending(true);
    clearChatError();
    const ok = await sendMessage({
      chatId,
      text: payload,
      kind: teacher ? kind : "text",
      user,
      meta:
        kind === "homework"
          ? { subject, due, status: "pending" }
          : kind === "daily_activity"
            ? { subject, activityDate: "Today" }
            : kind === "progress"
              ? { subject, score: "On track" }
              : undefined,
    });
    setSending(false);
    if (ok) {
      setText("");
      setKind("text");
    }
  };

  return (
    <PhoneShell
      hideNav
      showHeader
      headerAccent="primary"
      subtitle={chat.subtitle}
      title={chat.title}
      rightSlot={
        <Link href="/chats" className="icon-btn on-primary" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <div className="wa-thread">
        {messages.length === 0 && (
          <p className="text-sm muted" style={{ textAlign: "center", margin: "24px 8px" }}>
            No messages yet. Say hello to start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          const readCount = (m.readBy || []).filter((id) => id !== m.senderId).length;
          return (
            <div key={m.id} className={`wa-bubble-row ${mine ? "mine" : "theirs"}`}>
              <div
                className={`wa-bubble ${mine ? "mine" : "theirs"} kind-${m.kind}${m.pending ? " pending" : ""}${m.failed ? " failed" : ""}`}
              >
                {!mine && (
                  <p className="wa-sender">
                    {m.senderName}
                    {m.kind !== "text" && m.kind !== "system" && (
                      <span className="wa-kind">{MESSAGE_KIND_LABEL[m.kind]}</span>
                    )}
                  </p>
                )}
                {m.kind === "daily_activity" && (
                  <div className="wa-card-tag">
                    <CalendarCheck size={12} /> Daily activity
                    {m.meta?.subject ? ` · ${m.meta.subject}` : ""}
                  </div>
                )}
                {m.kind === "homework" && (
                  <div className="wa-card-tag hw">
                    <BookOpen size={12} /> Homework
                    {m.meta?.subject ? ` · ${m.meta.subject}` : ""}
                    {m.meta?.due
                      ? ` · Submit by ${/^\d{4}-\d{2}-\d{2}$/.test(m.meta.due) ? m.meta.due : m.meta.due}`
                      : ""}
                  </div>
                )}
                {m.kind === "progress" && (
                  <div className="wa-card-tag progress">
                    <Sparkles size={12} /> Progress
                    {m.meta?.score ? ` · ${m.meta.score}` : ""}
                  </div>
                )}
                <p className="wa-text">{m.text}</p>
                <div className="wa-react-row">
                  {(reactions[m.id] || []).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="wa-react-chip on"
                      onClick={() => toggleReaction(m.id, emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                  {!m.pending && !m.failed && (
                    <button
                      type="button"
                      className="wa-react-add"
                      onClick={() => setReactFor(reactFor === m.id ? null : m.id)}
                      aria-label="Add reaction"
                    >
                      +
                    </button>
                  )}
                </div>
                {reactFor === m.id && (
                  <div className="wa-react-picker">
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          toggleReaction(m.id, emoji);
                          setReactFor(null);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <span className="wa-time">
                  {formatChatTime(m.createdAt)}
                  {mine && m.pending ? " · Sending…" : ""}
                  {mine && m.failed ? " · Failed" : ""}
                  {mine && !m.pending && !m.failed && readCount > 0 ? " · Read" : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {chatError && (
        <p
          className="text-xs"
          style={{
            margin: "0 12px 8px",
            color: "var(--danger, #b42318)",
            background: "rgba(180,35,24,0.08)",
            padding: "8px 10px",
            borderRadius: 8,
          }}
          role="alert"
        >
          {chatError}
          <button
            type="button"
            className="text-xs"
            style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: 0, cursor: "pointer" }}
            onClick={clearChatError}
          >
            Dismiss
          </button>
        </p>
      )}

      <form className="wa-composer" onSubmit={onSend}>
        {teacher && (
          <div className="wa-post-tools">
            {(
              [
                ["text", "Chat"],
                ["daily_activity", "Activity"],
                ["homework", "Homework"],
                ["progress", "Progress"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`chip ${kind === k ? "active" : ""}`}
                onClick={() => setKind(k)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {teacher && (kind === "homework" || kind === "daily_activity" || kind === "progress") && (
          <div className="wa-meta-row">
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="wa-select">
              {["Math", "Science", "English", "Hindi", "Overall"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {kind === "homework" && (
              <input
                type="date"
                className="wa-select"
                value={due}
                min={toIsoDate()}
                onChange={(e) => setDue(e.target.value)}
                aria-label="Submission deadline"
              />
            )}
          </div>
        )}

        <div className="wa-input-row">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "daily_activity"
                ? "Share today’s class activity…"
                : kind === "homework"
                  ? "Describe homework…"
                  : kind === "progress"
                    ? "Share progress note…"
                    : "Type a message…"
            }
            disabled={sending}
          />
          <button
            type="submit"
            className="send-btn"
            aria-label="Send"
            disabled={!text.trim() || sending}
          >
            <Send size={16} />
          </button>
        </div>
        {teacher && (
          <p className="text-10 muted" style={{ margin: "6px 4px 0" }}>
            Posting as teacher — parents in this chat will get a notification.
          </p>
        )}
      </form>
    </PhoneShell>
  );
}
