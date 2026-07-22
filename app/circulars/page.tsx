"use client";

import { PhoneShell } from "@/components/PhoneShell";
import { Bookmark, FileText, ImageIcon, CheckCheck } from "@/components/Icons";

const feed = [
  {
    title: "Annual Sports Day on 5 July",
    body: "Dear parents, the annual sports day will be held on 5 July. Please ensure students wear house t-shirts.",
    time: "12 min ago",
    tag: "Event",
    tagClass: "badge badge-secondary",
    attach: "img" as const,
    unread: true,
  },
  {
    title: "Parent-Teacher meeting — Grade 6",
    body: "Scheduled this Saturday, 10 AM to 1 PM. Slot booking opens tomorrow.",
    time: "2 h ago",
    tag: "PTM",
    tagClass: "pill",
    tagStyle: { background: "rgb(37 99 235 / 0.1)", color: "var(--info)" },
    attach: "pdf" as const,
    unread: true,
  },
  {
    title: "Summer break announcement",
    body: "School reopens on 8 July. Holiday homework list attached.",
    time: "Yesterday",
    tag: "Notice",
    tagClass: "badge badge-warning",
    attach: "pdf" as const,
    unread: false,
  },
  {
    title: "Updated bus route — Route 12",
    body: "Pickup time changed from 7:25 to 7:30 AM starting Monday.",
    time: "2 d ago",
    tag: "Transport",
    tagClass: "pill",
    tagStyle: { background: "rgb(22 163 74 / 0.1)", color: "var(--success)" },
    attach: null,
    unread: false,
  },
];

export default function CircularsPage() {
  return (
    <PhoneShell subtitle="School updates" title="Circulars">
      <div className="chip-row">
        {["All", "Unread", "Events", "Notices", "PTM"].map((t, i) => (
          <button key={t} className={`chip ${i === 0 ? "active" : ""}`}>
            {t}
          </button>
        ))}
      </div>

      <ul className="feed mt-4">
        {feed.map((c, i) => (
          <li
            key={i}
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
              <span className={c.tagClass} style={c.tagStyle}>
                {c.tag}
              </span>
              <span className="muted font-medium">{c.time}</span>
              {!c.unread && (
                <span
                  className="muted row"
                  style={{ marginLeft: "auto", gap: 2 }}
                >
                  <CheckCheck size={14} /> Read
                </span>
              )}
            </div>
            <p className="font-medium text-15 mt-2" style={{ paddingRight: 24 }}>
              {c.title}
            </p>
            <p className="text-sm muted mt-1 line-clamp-2">{c.body}</p>
            <div className="row mt-2" style={{ justifyContent: "space-between" }}>
              {c.attach === "img" && (
                <span className="row text-xs muted" style={{ gap: 6 }}>
                  <ImageIcon size={16} /> 2 images
                </span>
              )}
              {c.attach === "pdf" && (
                <span className="row text-xs muted" style={{ gap: 6 }}>
                  <FileText size={16} /> PDF · 240 KB
                </span>
              )}
              {!c.attach && <span />}
              <button className="muted" aria-label="Bookmark">
                <Bookmark size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
