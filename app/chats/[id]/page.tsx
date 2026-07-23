"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/auth";
import {
  useSchoolData,
  formatChatTime,
  MESSAGE_KIND_LABEL,
  type MessageKind,
} from "@/lib/school-data";
import { useStudentEngage, REACTION_EMOJIS } from "@/lib/student-engage";
import { addDaysIso, toIsoDate } from "@/lib/dates";
import { ArrowLeft, Send, BookOpen, CalendarCheck, Sparkles } from "@/components/Icons";

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
  } = useSchoolData();
  const { toggleReaction, reactions, completeMission } = useStudentEngage();

  const chat = chats.find((c) => c.id === chatId);
  const messages = getMessages(chatId);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<MessageKind>("text");
  const [subject, setSubject] = useState("Math");
  const [due, setDue] = useState(addDaysIso(toIsoDate(), 2));
  const [reactFor, setReactFor] = useState<string | null>(null);
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
    return <div className="app-shell" />;
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

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage({
      chatId,
      text,
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
    setText("");
    setKind("text");
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
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`wa-bubble-row ${mine ? "mine" : "theirs"}`}>
              <div className={`wa-bubble ${mine ? "mine" : "theirs"} kind-${m.kind}`}>
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
                  <button
                    type="button"
                    className="wa-react-add"
                    onClick={() => setReactFor(reactFor === m.id ? null : m.id)}
                    aria-label="Add reaction"
                  >
                    +
                  </button>
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
                <span className="wa-time">{formatChatTime(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

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
          />
          <button type="submit" className="send-btn" aria-label="Send" disabled={!text.trim()}>
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
