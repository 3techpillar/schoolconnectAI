"use client";

import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useAuth } from "@/lib/auth";
import { useSchoolData } from "@/lib/school-data";
import { useTeacherClass, formatRelative } from "@/lib/teacher-class";
import { Bookmark, CheckCheck, Plus } from "@/components/Icons";

export default function CircularsPage() {
  const { user } = useAuth();
  const { canPostAsTeacher, sendMessage } = useSchoolData();
  const { circulars, addCircular, ready } = useTeacherClass();
  const teacher = canPostAsTeacher(user);

  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("Notice");

  const filters = ["All", "Unread", "Event", "Notice", "PTM"];

  const filtered = useMemo(() => {
    if (filter === "All") return circulars;
    if (filter === "Unread") return circulars.filter((c) => c.unread);
    return circulars.filter((c) => c.tag === filter);
  }, [circulars, filter]);

  const onPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    addCircular({ title, body, tag, user });
    sendMessage({
      chatId: "class-6b",
      text: `${title.trim()}\n\n${body.trim()}`,
      kind: "text",
      user,
    });
    setTitle("");
    setBody("");
    setShowForm(false);
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
        {teacher && (
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

      {teacher && showForm && (
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
          <button type="submit" className="btn-primary">
            Publish to class
          </button>
        </form>
      )}

      <ul className="feed mt-4">
        {filtered.map((c) => (
          <li
            key={c.id}
            className="relative"
            style={{ flexDirection: "column", alignItems: "stretch" }}
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
            <p className="text-sm muted mt-1 line-clamp-2">{c.body}</p>
            <div className="row mt-2" style={{ justifyContent: "space-between" }}>
              <span className="text-11 muted">By {c.postedBy}</span>
              <button className="muted" aria-label="Bookmark" type="button">
                <Bookmark size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
