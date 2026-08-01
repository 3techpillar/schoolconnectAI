"use client";

import Link from "next/link";
import { PhoneShell } from "@/components/PhoneShell";
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
} from "@/components/Icons";

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
        <p className="muted text-sm">Loading…</p>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell
      title="Notifications"
      subtitle={
        unreadNotifications > 0
          ? `${unreadNotifications} unread`
          : "You're all caught up"
      }
      headerAccent="plain"
    >
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <p className="text-xs muted" style={{ margin: 0 }}>
          Circulars, homework, activity & school alerts
        </p>
        {unreadNotifications > 0 && (
          <button
            type="button"
            className="text-xs font-semibold tone-primary row"
            style={{ gap: 4 }}
            onClick={() => markAllNotificationsRead()}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm muted mt-6" style={{ textAlign: "center" }}>
          No notifications yet. School circulars and class updates will appear here.
        </p>
      ) : (
        <ul className="notif-list">
          {notifications.map((n) => {
            const Icon = iconFor[n.type] || Bell;
            return (
              <li key={n.id} className={n.read ? "read" : "unread"}>
                <Link
                  href={n.href || "/"}
                  className="notif-row"
                  onClick={() => markNotificationRead(n.id)}
                >
                  <div className={`notif-icon type-${n.type}`}>
                    <Icon size={16} />
                  </div>
                  <div className="grow">
                    <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                      <p className="font-semibold text-sm truncate" style={{ margin: 0 }}>
                        {n.title}
                      </p>
                      <span className="text-10 muted">{formatChatTime(n.createdAt)}</span>
                    </div>
                    <p className="text-xs muted mt-1" style={{ marginBottom: 0 }}>
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
