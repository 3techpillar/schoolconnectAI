"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import {
  useSchoolData,
  formatChatTime,
  MESSAGE_KIND_LABEL,
  type MessageKind,
} from "@/lib/providers/school-data";
import { useStudentEngage, REACTION_EMOJIS } from "@/lib/providers/student-engage";
import { addDaysIso, toIsoDate } from "@/lib/shared/dates";
import {
  ArrowLeft,
  Send,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  Sparkles,
  MessageCircle,
} from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { AskBuddyModal } from "@/components/student/AskBuddyModal";

function getChannelAvatar(chat: { id: string; kind: string; title: string }) {
  const lowerTitle = chat.title.toLowerCase();
  if (chat.id === "ai-buddy" || lowerTitle.includes("buddy") || lowerTitle.includes("ai")) {
    return "/assets/icons/icon_ai_buddy_3d.jpg";
  }
  if (chat.kind === "bus" || chat.id.includes("bus") || lowerTitle.includes("bus")) {
    return "/assets/chats/avatar_bus_3d.jpg";
  }
  if (chat.kind === "class" || lowerTitle.includes("class")) {
    return "/assets/chats/avatar_class_3d.jpg";
  }
  return "/assets/mascots/owl_graduate.jpg";
}

const STUDENT_QUICK_REPLIES = [
  "I have a doubt! 🙋‍♂️",
  "Homework submitted! ✅",
  "Thank you teacher! 🙏",
  "Can you share the notes? 📝",
  "Got it, thank you! ⭐",
];

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
  const { toggleReaction, reactions, completeMission, awardXp } = useStudentEngage();

  const chat = chats.find((c) => c.id === chatId);
  const messages = getMessages(chatId);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<MessageKind>("text");
  const [subject, setSubject] = useState("Math");
  const [due, setDue] = useState(addDaysIso(toIsoDate(), 2));
  const [reactFor, setReactFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const teacher = canPostAsTeacher(user);

  const firstName = user?.childName?.split(" ")[0] || user?.name?.split(" ")[0] || "Friend";

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
        <LoadingBlock label="Opening chat conversation…" />
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

  const channelAvatar = getChannelAvatar(chat);

  const onSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const payload = customText || text;
    if (!payload.trim() || sending) return;
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
      awardXp(5);
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
        <div className="row" style={{ gap: 6, alignItems: "center" }}>
          <button
            type="button"
            className="icon-btn on-primary"
            onClick={() => setIsBuddyOpen(true)}
            title="Ask AI Study Buddy"
            aria-label="Ask Buddy"
          >
            <Sparkles size={16} />
          </button>
          <Link href="/chats" className="icon-btn on-primary" aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
        </div>
      }
    >
      {/* 3D Channel Mini Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          borderRadius: 16,
          border: "1.5px solid #EEF2FF",
          margin: "8px 0 10px",
          boxShadow: "0 4px 14px -3px rgba(99, 102, 241, 0.08)",
        }}
      >
        <div className="wa-thread-avatar-mini" style={{ width: 40, height: 40 }}>
          <Image
            src={channelAvatar}
            alt={chat.title}
            width={40}
            height={40}
          />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <p className="font-semibold text-13 truncate" style={{ margin: 0, color: "#1E1B4B" }}>
            {chat.title}
          </p>
          <p className="text-11 muted truncate" style={{ margin: "2px 0 0" }}>
            Active · Class Community
          </p>
        </div>
        <button
          type="button"
          className="hw-solve-ai-btn"
          onClick={() => setIsBuddyOpen(true)}
          style={{ padding: "4px 9px", fontSize: "0.7rem", borderRadius: 999 }}
        >
          <Sparkles size={12} /> Ask Buddy
        </button>
      </div>

      <div className="wa-thread-canvas">
        {messages.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            tone="teal"
            title="No messages yet"
            body="Say hello or ask a question to start the discussion!"
          />
        )}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          const readCount = (m.readBy || []).filter((id) => id !== m.senderId).length;
          return (
            <div key={m.id} className={`wa-bubble-row ${mine ? "mine" : "theirs"}`}>
              <div
                className={`wa-bubble-enhanced ${mine ? "mine" : "theirs"} kind-${m.kind}${m.pending ? " pending" : ""}${m.failed ? " failed" : ""}`}
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
                    <BookOpen size={12} /> Homework Quest
                    {m.meta?.subject ? ` · ${m.meta.subject}` : ""}
                    {m.meta?.due
                      ? ` · Due ${m.meta.due}`
                      : ""}
                  </div>
                )}
                {m.kind === "progress" && (
                  <div className="wa-card-tag progress">
                    <Sparkles size={12} /> Progress Milestone
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
                  {mine && !m.pending && !m.failed && (
                    <span
                      className="wa-read-status"
                      style={{ marginLeft: 4 }}
                      title={readCount > 0 ? `Read by ${readCount}` : "Sent"}
                    >
                      <CheckCheck size={13} />
                    </span>
                  )}
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

      {/* Student Quick-Prompt Suggestions */}
      <div className="wa-quick-prompt-carousel">
        {STUDENT_QUICK_REPLIES.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="wa-quick-prompt-chip"
            onClick={() => onSend(undefined, prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Floating Glassmorphic Composer */}
      <form className="wa-composer-capsule" onSubmit={onSend}>
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

        <div className="wa-input-pill">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              kind === "daily_activity"
                ? "Share today’s class activity…"
                : kind === "homework"
                  ? "Describe homework quest…"
                  : kind === "progress"
                    ? "Share progress milestone…"
                    : "Type a message or ask a doubt…"
            }
            disabled={sending}
          />
          <button
            type="submit"
            className="wa-send-btn"
            aria-label="Send"
            disabled={!text.trim() || sending}
          >
            <Send size={15} />
          </button>
        </div>
        {teacher && (
          <p className="text-10 muted" style={{ margin: "5px 4px 0" }}>
            Posting as class teacher — parents will receive an instant notification.
          </p>
        )}
      </form>

      {/* AI Study Buddy Modal Drawer */}
      <AskBuddyModal
        isOpen={isBuddyOpen}
        onClose={() => setIsBuddyOpen(false)}
        studentName={firstName}
      />
    </PhoneShell>
  );
}
