"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useSchoolData, formatChatTime } from "@/lib/providers/school-data";
import { Search, Pin, MessageCircle } from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { useMemo, useState } from "react";

export default function ChatsPage() {
  const { chats, getMessages, ready } = useSchoolData();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.subtitle.toLowerCase().includes(query),
    );
  }, [chats, q]);

  const unreadCount = chats.filter((c) => c.unread).length;

  if (!ready) {
    return (
      <PhoneShell title="Chats" subtitle="School messaging">
        <LoadingBlock label="Loading messages…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      title="Messages"
      subtitle={unreadCount ? `${unreadCount} unread` : "All caught up"}
      headerAccent="plain"
    >
      {/* Search Bar */}
      <div className="chat-search-pill">
        <Search size={16} style={{ color: "var(--ink-soft)", flexShrink: 0 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search class, teacher, subjects…"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          tone="teal"
          title={q.trim() ? "No chats match your search" : "No chats yet"}
          body={
            q.trim()
              ? "Try another name or clear the search."
              : "Class and school chats appear here after your first sync."
          }
        />
      ) : (
        <div className="card card-pad" style={{ padding: "0.5rem 0.75rem", background: "var(--surface)" }}>
          {filtered.map((chat) => {
            const msgs = getMessages(chat.id);
            const last = msgs[msgs.length - 1];
            const avatarBg =
              chat.kind === "class"
                ? "var(--primary)"
                : chat.kind === "bus"
                  ? "var(--accent)"
                  : "var(--info)";

            return (
              <Link key={chat.id} href={`/chats/${chat.id}`} className="chat-row">
                <div className="chat-avatar-sq" style={{ background: avatarBg }}>
                  {chat.avatar}
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                    <p className="chat-title truncate" style={{ margin: 0 }}>
                      {chat.title}
                      {chat.pinned && (
                        <Pin size={12} style={{ marginLeft: 6, color: "var(--warning)" }} />
                      )}
                    </p>
                  </div>
                  <p className="chat-sub truncate" style={{ margin: "2px 0 0" }}>
                    {last
                      ? `${last.kind !== "text" && last.kind !== "system" ? `[${last.kind.replace("_", " ")}] ` : ""}${last.text}`
                      : chat.subtitle}
                  </p>
                </div>
                <div className="chat-meta">
                  <div className="chat-time">{formatChatTime(chat.lastMessageAt)}</div>
                  {chat.unread > 0 && <span className="unread-pill">{chat.unread}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PhoneShell>
  );
}
