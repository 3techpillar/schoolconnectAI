"use client";

import Link from "next/link";
import Image from "next/image";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useSchoolData, formatChatTime } from "@/lib/providers/school-data";
import { useAuth } from "@/lib/providers/auth";
import { Search, Pin, MessageCircle, Sparkles } from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";
import { useMemo, useState } from "react";
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

export default function ChatsPage() {
  const { user } = useAuth();
  const { chats, getMessages, ready } = useSchoolData();
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "class" | "bus" | "teachers">("all");
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);

  const firstName = user?.childName?.split(" ")[0] || user?.name?.split(" ")[0] || "Friend";

  const filtered = useMemo(() => {
    let list = chats;
    if (activeFilter === "class") {
      list = list.filter((c) => c.kind === "class" || c.title.toLowerCase().includes("class"));
    } else if (activeFilter === "bus") {
      list = list.filter((c) => c.kind === "bus" || c.title.toLowerCase().includes("bus"));
    } else if (activeFilter === "teachers") {
      list = list.filter((c) => c.kind === "teacher");
    }

    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.subtitle.toLowerCase().includes(query),
    );
  }, [chats, q, activeFilter]);

  const unreadCount = chats.filter((c) => c.unread).length;

  if (!ready) {
    return (
      <PhoneShell title="Messages" subtitle="School messaging">
        <LoadingBlock label="Loading class discussions…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      title="Messages"
      subtitle={unreadCount ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All caught up ✨"}
      headerAccent="plain"
    >
      {/* 3D Student Hub Hero Banner */}
      <section className="chats-student-hero mt-1">
        <div className="chats-student-banner-wrap">
          <Image
            src="/assets/chats/chats_hero_banner.jpg"
            alt="SchoolConnect Student Chat Hub"
            width={720}
            height={405}
            priority
            className="chats-student-banner-img"
          />
          <div className="chats-student-banner-overlay">
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FDE047", textTransform: "uppercase", letterSpacing: "0.06em", display: "inline-flex", alignItems: "center", gap: 5 }}>
              💬 Student Community Hub
            </span>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, margin: "2px 0 0", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              Welcome back, {firstName}! 🚀
            </h2>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.9)", margin: "4px 0 0" }}>
              Class discussions, live bus notifications & instant AI Study Buddy
            </p>
          </div>
        </div>
      </section>

      {/* Instant AI Study Buddy Shortcut Card */}
      <div
        className="buddy-instant-card mb-3"
        onClick={() => setIsBuddyOpen(true)}
        role="button"
        tabIndex={0}
      >
        <div className="buddy-instant-avatar">
          <Image
            src="/assets/icons/icon_ai_buddy_3d.jpg"
            alt="AI Study Buddy"
            width={52}
            height={52}
          />
        </div>
        <div className="buddy-instant-body">
          <h4 className="buddy-instant-title">
            AI Study Pal <Sparkles size={14} style={{ color: "#6366F1" }} />
          </h4>
          <p className="buddy-instant-desc">
            Ask any question 24/7 & earn XP for daily missions!
          </p>
        </div>
        <div className="buddy-instant-cta">
          Chat Now
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="chat-search-pill mb-3">
        <Search size={16} style={{ color: "var(--ink-soft)", flexShrink: 0 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search class topics, teacher messages, bus radar…"
        />
      </div>

      {/* Quick Category Filter Pills */}
      <div className="hw-subject-scroll mb-3">
        {[
          { key: "all", label: "All Chats", icon: "💬" },
          { key: "class", label: "Class 6-B", icon: "🏫" },
          { key: "bus", label: "Bus Radar", icon: "🚌" },
          { key: "teachers", label: "Teachers", icon: "🎓" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`hw-subject-pill-btn ${activeFilter === tab.key ? "active" : ""}`}
            onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 3D Chat Channels List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          tone="teal"
          title={q.trim() ? "No conversations match your search" : "No chats yet"}
          body={
            q.trim()
              ? "Try typing another keyword or reset the filter."
              : "Class broadcasts and messages will appear here."
          }
        />
      ) : (
        <div className="space-y" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((chat) => {
            const msgs = getMessages(chat.id);
            const last = msgs[msgs.length - 1];
            const avatarSrc = getChannelAvatar(chat);
            const channelTagClass =
              chat.kind === "class"
                ? "chat-channel-class"
                : chat.kind === "bus"
                  ? "chat-channel-bus"
                  : "chat-channel-ai";

            return (
              <Link key={chat.id} href={`/chats/${chat.id}`} className="chat-row-3d">
                <div className="chat-avatar-3d-wrap">
                  <Image
                    src={avatarSrc}
                    alt={chat.title}
                    width={50}
                    height={50}
                  />
                  <span className="chat-online-beacon" />
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <div className="row" style={{ gap: 6, alignItems: "center", minWidth: 0 }}>
                      <p className="font-semibold text-15 truncate" style={{ margin: 0, color: "var(--foreground)" }}>
                        {chat.title}
                      </p>
                      {chat.pinned && (
                        <Pin size={12} style={{ color: "var(--warning)", flexShrink: 0 }} />
                      )}
                    </div>
                    <span className={`chat-channel-tag ${channelTagClass}`}>
                      {chat.kind}
                    </span>
                  </div>
                  <p className="text-xs muted truncate" style={{ margin: "4px 0 0" }}>
                    {last
                      ? `${last.kind !== "text" && last.kind !== "system" ? `[${last.kind.replace("_", " ")}] ` : ""}${last.text}`
                      : chat.subtitle}
                  </p>
                </div>
                <div className="chat-meta" style={{ flexShrink: 0, textAlign: "right" }}>
                  <div className="chat-time" style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    {formatChatTime(chat.lastMessageAt)}
                  </div>
                  {chat.unread > 0 && (
                    <span className="unread-pill" style={{ marginTop: 4 }}>
                      {chat.unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* AI Study Buddy Modal Drawer */}
      <AskBuddyModal
        isOpen={isBuddyOpen}
        onClose={() => setIsBuddyOpen(false)}
        studentName={firstName}
      />
    </PhoneShell>
  );
}
