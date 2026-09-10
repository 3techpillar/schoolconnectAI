"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/shell/PhoneShell";
import { useSchoolData, formatChatTime } from "@/lib/providers/school-data";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  Megaphone,
  MessageCircle,
  Sparkles,
  Wallet,
  Bus,
} from "@/components/shell/Icons";
import { EmptyState, LoadingBlock } from "@/components/shell/StatusUI";

const iconFor = {
  homework: BookOpen,
  activity: CalendarCheck,
  progress: Sparkles,
  fees: Wallet,
  circular: Megaphone,
  chat: MessageCircle,
  system: Bell,
  bus: Bus,
} as const;

export default function NotificationsPage() {
  const {
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    ready,
  } = useSchoolData();

  if (!ready) {
    return (
      <PhoneShell title="Notifications" subtitle="Alerts">
        <LoadingBlock label="Loading alerts…" />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      title="Notifications"
      subtitle={
        unreadNotifications > 0
          ? `${unreadNotifications} unread alerts`
          : "All caught up"
      }
      headerAccent="plain"
    >
      <div className="row mt-2" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <p className="text-11 muted" style={{ margin: 0 }}>
          Direct deep-links to academic and campus events
        </p>
        {unreadNotifications > 0 && (
          <button
            type="button"
            className="text-xs font-semibold tone-primary row"
            style={{ gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
            onClick={() => markAllNotificationsRead()}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          tone="blue"
          title="No notifications yet"
          body="School circulars, bus alerts and class notices will appear here."
        />
      ) : (
        <ul className="notif-list-card">
          {notifications.map((n) => {
            const Icon = iconFor[n.type] || Bell;
            return (
              <li key={n.id}>
                <Link
                  href={n.href || "/"}
                  className={`notif-item ${!n.read ? "unread" : ""}`}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <div className={`notif-icon type-${n.type}`}>
                    <Icon size={17} />
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div
                      className="row"
                      style={{ justifyContent: "space-between", gap: 8 }}
                    >
                      <p
                        className="font-semibold text-14 truncate"
                        style={{ margin: 0, color: "var(--foreground)" }}
                      >
                        {n.title}
                      </p>
                      <span className="text-10 muted" style={{ flexShrink: 0 }}>
                        {formatChatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs muted truncate" style={{ margin: "3px 0 0" }}>
                      {n.body}
                    </p>
                  </div>
                  {!n.read && <span className="unread-dot" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PhoneShell>
  );
}
