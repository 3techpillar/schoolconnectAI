"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { useTeacherClass, formatRelative } from "@/lib/providers/teacher-class";
import { canBroadcastNotification } from "@/lib/shared/roles";
import { Bookmark, CheckCheck, Plus, Megaphone, CalendarCheck } from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";

export default function CircularsPage() {
  const { user, backend } = useAuth();
  const { sendMessage, pushNotification, chats } = useSchoolData();
  const { circulars, addCircular, markCircularRead, ready } = useTeacherClass();
  const canPublish = canBroadcastNotification(user?.role);

  const [filter, setFilter] = useState("All");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Notice");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = ["All", "Unread", "Saved", "Event", "Notice", "PTM"];

  const filtered = useMemo(() => {
    if (filter === "All") return circulars;
    if (filter === "Unread") return circulars.filter((c) => c.unread);
    if (filter === "Saved") return circulars.filter((c) => savedIds.includes(c.id));
    return circulars.filter((c) => c.tag === filter);
  }, [circulars, filter, savedIds]);

  const classChatId = useMemo(() => {
    const cn = user?.className || "6-B";
    const match = chats.find(
      (c) => c.kind === "class" && (c.className === cn || c.id.includes(cn.toLowerCase().replace("-", ""))),
    );
    return match?.id || chats.find((c) => c.kind === "class")?.id || "class-6b";
  }, [chats, user?.className]);

  const onPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim() || publishing) return;
    setPublishing(true);
    setError(null);
    const ok = await addCircular({ title, body, tag, user });
    if (!ok) {
      setError("Could not publish circular. Try again.");
      setPublishing(false);
      return;
    }
    void sendMessage({
      chatId: classChatId,
      text: `📢 ${tag}: ${title.trim()}\n\n${body.trim()}`,
      kind: "text",
      user,
    });
    // Offline only — backend already creates a circular notification.
    if (!backend) {
      pushNotification({
        title: `${tag} · ${title.trim()}`,
        body: body.trim().slice(0, 160),
        type: "circular",
        href: "/circulars",
      });
    }
    setTitle("");
    setBody("");
    setShowForm(false);
    setPublishing(false);
  };

  if (!ready) {
    return (
      <PhoneShell subtitle="School updates" title="Circulars">
        <LoadingBlock label="Loading circulars…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell subtitle="School updates" title="Circulars" headerAccent="plain">
      {/* Category filter pills & new circular trigger */}
      <div className="row mt-2" style={{ gap: 8, alignItems: "center" }}>
        <div className="chip-row" style={{ flex: 1, paddingBottom: 2 }}>
          {filters.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${filter === t ? "active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {canPublish && (
          <button
            type="button"
            className="icon-btn"
            style={{
              background: showForm ? "var(--blue-tint)" : "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
              flexShrink: 0,
            }}
            aria-label="New announcement"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Publisher Drawer Form */}
      {canPublish && showForm && (
        <form className="card card-pad mt-3 space-y" onSubmit={onPublish} style={{ borderColor: "rgba(37, 99, 235, 0.3)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <p className="font-semibold text-sm" style={{ margin: 0 }}>
              Broadcast Announcement
            </p>
            <span className="text-10 muted">Class & Parent notice</span>
          </div>
          <select
            className="wa-select"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            {["Notice", "Event", "PTM", "Homework", "Transport"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement Title"
            required
          />
          <textarea
            className="input"
            style={{ minHeight: 90, resize: "vertical" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Official details for students and parents…"
            required
          />
          {error && (
            <p className="text-xs" style={{ color: "var(--danger, #b42318)", margin: 0 }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={publishing}>
            {publishing ? "Publishing…" : "Broadcast to School"}
          </button>
        </form>
      )}

      {/* Circular Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          tone="blue"
          title={
            filter === "Unread"
              ? "No unread circulars"
              : filter === "Saved"
                ? "No saved circulars"
                : filter === "All"
                  ? "No circulars yet"
                  : `No ${filter} circulars`
          }
          body="When the school publishes a notice, it will show up here."
        />
      ) : (
        <ul className="circular-list-container">
          {filtered.map((c) => {
            const isSaved = savedIds.includes(c.id);
            return (
              <li
                key={c.id}
                className={`circular-card ${c.unread ? "unread" : ""}`}
                onClick={() => {
                  if (c.unread) markCircularRead(c.id);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div className="row" style={{ gap: 6, alignItems: "center" }}>
                    <span className={`circular-tag tag-${c.tag.toLowerCase()}`}>
                      {c.tag}
                    </span>
                    <span className="text-11 muted row" style={{ gap: 4 }}>
                      <CalendarCheck size={12} /> {formatRelative(c.createdAt)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`circular-save-btn ${isSaved ? "is-saved" : ""}`}
                    aria-label={isSaved ? "Unsave circular" : "Save circular"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSavedIds((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id],
                      );
                    }}
                  >
                    <Bookmark size={15} />
                  </button>
                </div>

                <h3 className="font-semibold text-15 mt-2" style={{ margin: "0.5rem 0 0.25rem", color: "var(--foreground)" }}>
                  {c.title}
                </h3>

                <p className="text-xs muted" style={{ margin: "0 0 0.75rem", lineHeight: 1.5 }}>
                  {c.body}
                </p>

                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                  <span className="text-11 muted">Posted by <strong>{c.postedBy}</strong></span>
                  {!c.unread && (
                    <span className="text-11 muted row" style={{ gap: 4 }}>
                      <CheckCheck size={14} style={{ color: "#10b981" }} /> Acknowledged
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PhoneShell>
  );
}
