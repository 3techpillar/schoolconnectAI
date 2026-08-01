"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/providers/auth";
import { useSchoolData } from "@/lib/providers/school-data";
import { useTeacherClass, formatRelative } from "@/lib/providers/teacher-class";
import { canBroadcastNotification } from "@/lib/shared/roles";
import { Bookmark, CheckCheck, Plus } from "@/components/Icons";

export default function CircularsPage() {
  const { user, backend } = useAuth();
  const { sendMessage, pushNotification, chats } = useSchoolData();
  const { circulars, addCircular, markCircularRead, ready } = useTeacherClass();
  const canPublish = canBroadcastNotification(user?.role);

  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Notice");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = ["All", "Unread", "Event", "Notice", "PTM"];

  const filtered = useMemo(() => {
    if (filter === "All") return circulars;
    if (filter === "Unread") return circulars.filter((c) => c.unread);
    return circulars.filter((c) => c.tag === filter);
  }, [circulars, filter]);

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
        <p className="muted text-sm">Loading…</p>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell subtitle="School updates" title="Circulars">
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <div className="chip-row" style={{ flex: 1 }}>
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
            className="icon-btn muted"
            aria-label="New announcement"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {canPublish && showForm && (
        <form className="card card-pad mt-3 space-y" onSubmit={onPublish}>
          <p className="font-semibold text-sm" style={{ margin: 0 }}>
            Publish announcement
          </p>
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
            placeholder="Title"
            required
          />
          <textarea
            className="input"
            style={{ minHeight: 90, resize: "vertical" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message for parents"
            required
          />
          {error && (
            <p className="text-xs" style={{ color: "var(--danger, #b42318)", margin: 0 }}>
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={publishing}>
            {publishing ? "Publishing…" : "Publish to class"}
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm muted mt-6" style={{ textAlign: "center" }}>
          {filter === "Unread"
            ? "No unread circulars"
            : filter === "All"
              ? "No circulars yet"
              : `No ${filter} circulars`}
        </p>
      ) : (
        <ul className="feed mt-4">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="relative"
              style={{
                flexDirection: "column",
                alignItems: "stretch",
                cursor: "pointer",
              }}
              onClick={() => {
                if (c.unread) markCircularRead(c.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && c.unread) markCircularRead(c.id);
              }}
              role="button"
              tabIndex={0}
            >
              {c.unread && (
                <span
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--primary)",
                  }}
                />
              )}
              <div className="row text-10 font-semibold" style={{ gap: 8 }}>
                <span className="badge badge-secondary">{c.tag}</span>
                <span className="muted font-medium">{formatRelative(c.createdAt)}</span>
                {!c.unread && (
                  <span className="muted row" style={{ marginLeft: "auto", gap: 2 }}>
                    <CheckCheck size={14} /> Read
                  </span>
                )}
              </div>
              <p className="font-medium text-15 mt-2" style={{ paddingRight: 24 }}>
                {c.title}
              </p>
              <p className="text-sm muted mt-1">{c.body}</p>
              <div className="row mt-2" style={{ justifyContent: "space-between" }}>
                <span className="text-11 muted">By {c.postedBy}</span>
                <span className="muted" aria-hidden>
                  <Bookmark size={16} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PhoneShell>
  );
}
