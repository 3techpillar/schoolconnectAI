"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useSchoolData, formatChatTime } from "@/lib/providers/school-data";
import { Search, Pin, MessageCircle, CheckCheck } from "@/components/shell/Icons";
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
      <div className="chat-search-wrapper">
        <div className="chat-search-box">
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search class, teacher, route…"
          />
        </div>
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
        <ul className="chat-list-card">
          {filtered.map((chat) => {
            const msgs = getMessages(chat.id);
            const last = msgs[msgs.length - 1];
            return (
              <li key={chat.id}>
                <Link href={`/chats/${chat.id}`} className="chat-item-row">
                  <div className="chat-avatar-ring">
                    <div className={`chat-avatar kind-${chat.kind}`}>{chat.avatar}</div>
                    <span className="chat-status-dot" />
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                      <p className="font-semibold text-15 truncate" style={{ margin: 0, color: "var(--foreground)" }}>
                        {chat.title}
                        {chat.pinned && (
                          <Pin size={12} style={{ marginLeft: 6, color: "#f59e0b" }} />
                        )}
                      </p>
                      <span className="text-10 muted" style={{ flexShrink: 0 }}>
                        {formatChatTime(chat.lastMessageAt)}
                      </span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", gap: 8, marginTop: 3 }}>
                      <p className="text-xs muted truncate" style={{ margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        {last?.senderId && (
                          <span style={{ color: "#3b82f6", display: "inline-flex", flexShrink: 0 }}>
                            <CheckCheck size={13} />
                          </span>
                        )}
                        <span className="truncate">
                          {last
                            ? `${last.kind !== "text" && last.kind !== "system" ? `[${last.kind.replace("_", " ")}] ` : ""}${last.text}`
                            : chat.subtitle}
                        </span>
                      </p>
                      {chat.unread > 0 && <span className="wa-unread-badge">{chat.unread}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PhoneShell>
  );
}
