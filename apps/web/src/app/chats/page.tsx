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
      <section className="list-hero list-hero-teal">
        <p className="list-hero-kicker">School messaging</p>
        <h2 className="list-hero-title">Stay close to class &amp; teachers</h2>
        <p className="list-hero-body">
          Homework, circulars and parent notes in one trusted thread.
        </p>
      </section>

      <div className="chat-search">
        <Search size={16} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search class, teacher, bus…"
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
        <ul className="chat-list mt-3">
          {filtered.map((chat) => {
            const msgs = getMessages(chat.id);
            const last = msgs[msgs.length - 1];
            return (
              <li key={chat.id}>
                <Link href={`/chats/${chat.id}`} className="chat-row">
                  <div className={`chat-avatar kind-${chat.kind}`}>{chat.avatar}</div>
                  <div className="grow">
                    <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                      <p className="font-semibold text-15 truncate" style={{ margin: 0 }}>
                        {chat.title}
                        {chat.pinned && (
                          <Pin size={12} style={{ marginLeft: 6, opacity: 0.55 }} />
                        )}
                      </p>
                      <span className="text-10 muted">{formatChatTime(chat.lastMessageAt)}</span>
                    </div>
                    <div className="row" style={{ justifyContent: "space-between", gap: 8, marginTop: 2 }}>
                      <p className="text-xs muted truncate" style={{ margin: 0 }}>
                        {last
                          ? `${last.kind !== "text" && last.kind !== "system" ? `[${last.kind.replace("_", " ")}] ` : ""}${last.text}`
                          : chat.subtitle}
                      </p>
                      {chat.unread > 0 && <span className="unread-pill">{chat.unread}</span>}
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
