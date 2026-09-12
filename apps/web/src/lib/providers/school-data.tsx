"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@/lib/providers/auth";
import { useAuth } from "@/lib/providers/auth";
import { apiFetch } from "@/lib/shared/api-client";
import { addDaysIso, formatDueLabel, toIsoDate } from "@/lib/shared/dates";
import type {
  MessageKind,
  HomeworkStatus,
  HomeworkPriority,
  ChatMessage,
  ChatThread,
  AppNotification,
  HomeworkItem,
} from "@schoolconnect/shared";

export type {
  MessageKind,
  HomeworkStatus,
  HomeworkPriority,
  ChatMessage,
  ChatThread,
  AppNotification,
  HomeworkItem,
};

interface SchoolDataCtx {
  ready: boolean;
  chats: ChatThread[];
  messagesByChat: Record<string, ChatMessage[]>;
  notifications: AppNotification[];
  homework: HomeworkItem[];
  unreadNotifications: number;
  unreadChats: number;
  chatError: string | null;
  clearChatError: () => void;
  refreshNotifications: () => Promise<void>;
  getMessages: (chatId: string) => ChatMessage[];
  sendMessage: (input: {
    chatId: string;
    text: string;
    kind?: MessageKind;
    user: UserProfile;
    meta?: ChatMessage["meta"];
    syncHomework?: boolean;
  }) => Promise<boolean>;
  markChatRead: (chatId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addHomework: (item: Omit<HomeworkItem, "id" | "createdAt">, user: UserProfile) => void;
  updateHomeworkStatus: (id: string, status: HomeworkStatus, user: UserProfile) => void;
  canPostAsTeacher: (user: UserProfile | null) => boolean;
  upsertChat: (chat: ChatThread) => void;
  pushNotification: (input: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
}

const CHATS_KEY = "sc_chats_v1";
const MSGS_KEY = "sc_messages_v1";
const NOTIF_KEY = "sc_notifications_v1";
const HW_KEY = "sc_homework_v1";
const SEEDED_KEY = "sc_school_seeded_v1";

const Ctx = createContext<SchoolDataCtx | null>(null);

function sortChats(list: ChatThread[]) {
  return [...list].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.lastMessageAt - a.lastMessageAt;
  });
}

function canPostAsTeacher(user: UserProfile | null) {
  if (!user) return false;
  // School Admin / Super Admin use the Admin console, not the teacher desk.
  return user.role === "class_teacher" || user.role === "principal";
}

function seedChats(): ChatThread[] {
  const now = Date.now();
  return [
    {
      id: "class-6b",
      title: "Class 6-B",
      subtitle: "Ms. Kapoor · Daily updates",
      kind: "class",
      className: "6-B",
      avatar: "6B",
      pinned: true,
      lastMessageAt: now - 1000 * 60 * 12,
      unread: 2,
    },
    {
      id: "teacher-kapoor",
      title: "Ms. Kapoor",
      subtitle: "Class teacher",
      kind: "teacher",
      className: "6-B",
      avatar: "MK",
      lastMessageAt: now - 1000 * 60 * 55,
      unread: 1,
    },
    {
      id: "school-office",
      title: "School Office",
      subtitle: "Circulars & announcements",
      kind: "school",
      avatar: "SO",
      lastMessageAt: now - 1000 * 60 * 60 * 5,
      unread: 0,
    },
    {
      id: "bus-route-12",
      title: "Bus Route 12",
      subtitle: "Transport updates",
      kind: "bus",
      avatar: "B12",
      lastMessageAt: now - 1000 * 60 * 60 * 26,
      unread: 0,
    },
  ];
}

function seedMessages(): Record<string, ChatMessage[]> {
  const now = Date.now();
  return {
    "class-6b": [
      {
        id: "m1",
        chatId: "class-6b",
        kind: "daily_activity",
        text: "Today we completed fractions revision and a short quiz. Most students did well. Please revise exercise 4.1 at home.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAt: now - 1000 * 60 * 60 * 6,
        meta: { activityDate: "Today", subject: "Math" },
      },
      {
        id: "m2",
        chatId: "class-6b",
        kind: "homework",
        text: "Homework posted: Exercise 4.2 — Fractions. Due tomorrow.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAt: now - 1000 * 60 * 60 * 5,
        meta: {
          subject: "Math",
          due: "Tomorrow",
          status: "pending",
        },
      },
      {
        id: "m3",
        chatId: "class-6b",
        kind: "progress",
        text: "Aarav's weekly progress: Attendance 100%, Homework 4/5 done, Class test — A.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAt: now - 1000 * 60 * 60 * 2,
        meta: { score: "A", subject: "Overall" },
      },
      {
        id: "m4",
        chatId: "class-6b",
        kind: "text",
        text: "Please ensure students bring house t-shirts for Sports Day practice tomorrow.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAt: now - 1000 * 60 * 12,
      },
    ],
    "teacher-kapoor": [
      {
        id: "t1",
        chatId: "teacher-kapoor",
        kind: "text",
        text: "Hello! Feel free to message me about Aarav's school work.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAt: now - 1000 * 60 * 60 * 24,
      },
      {
        id: "t2",
        chatId: "teacher-kapoor",
        kind: "progress",
        text: "Aarav participated well in today's science discussion. Encourage him to finish the plant cell diagram.",
        senderId: "teacher-1",
        senderName: "Ms. Kapoor",
        senderRole: "class_teacher",
        createdAt: now - 1000 * 60 * 55,
        meta: { subject: "Science", score: "Good" },
      },
    ],
    "school-office": [
      {
        id: "s1",
        chatId: "school-office",
        kind: "system",
        text: "Welcome to School Office updates. Circulars and events will appear here.",
        senderId: "school",
        senderName: "School Office",
        senderRole: "school",
        createdAt: now - 1000 * 60 * 60 * 48,
      },
      {
        id: "s2",
        chatId: "school-office",
        kind: "text",
        text: "Annual Sports Day on 5 July. Consent forms due this Friday.",
        senderId: "school",
        senderName: "School Office",
        senderRole: "school",
        createdAt: now - 1000 * 60 * 60 * 5,
      },
    ],
    "bus-route-12": [
      {
        id: "b1",
        chatId: "bus-route-12",
        kind: "text",
        text: "Route 12 morning pickup starts at 7:30 AM from Monday.",
        senderId: "bus-1",
        senderName: "Transport Desk",
        senderRole: "bus_attendant",
        createdAt: now - 1000 * 60 * 60 * 26,
      },
    ],
  };
}

function seedNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: "n1",
      title: "New homework · Math",
      body: "Exercise 4.2 — Fractions due tomorrow",
      createdAt: now - 1000 * 60 * 20,
      read: false,
      type: "homework",
      href: "/homework",
    },
    {
      id: "n2",
      title: "Daily activity · Class 6-B",
      body: "Ms. Kapoor posted today’s class update",
      createdAt: now - 1000 * 60 * 45,
      read: false,
      type: "activity",
      href: "/chats/class-6b",
    },
    {
      id: "n3",
      title: "Progress update",
      body: "Weekly snapshot for Aarav is available",
      createdAt: now - 1000 * 60 * 90,
      read: false,
      type: "progress",
      href: "/chats/teacher-kapoor",
    },
    {
      id: "n4",
      title: "Fee reminder",
      body: "₹4,200 due on 28 Jun 2026",
      createdAt: now - 1000 * 60 * 60 * 8,
      read: true,
      type: "fees",
      href: "/fees",
    },
    {
      id: "n5",
      title: "Circular",
      body: "Annual Sports Day on 5 July",
      createdAt: now - 1000 * 60 * 60 * 12,
      read: true,
      type: "circular",
      href: "/circulars",
    },
  ];
}

function seedHomework(): HomeworkItem[] {
  const now = Date.now();
  const today = toIsoDate();
  const d1 = addDaysIso(today, 1);
  const d2 = addDaysIso(today, 4);
  const d3 = addDaysIso(today, 7);
  const d0 = addDaysIso(today, -1);
  return [
    {
      id: "hw1",
      subject: "Math",
      title: "Exercise 4.2 — Fractions",
      due: formatDueLabel(d1),
      dueDate: d1,
      priority: "high",
      attachments: 1,
      status: "pending",
      className: "6-B",
      postedBy: "Ms. Kapoor",
      createdAt: now - 1000 * 60 * 60 * 5,
    },
    {
      id: "hw2",
      subject: "Science",
      title: "Plant cell diagram",
      due: formatDueLabel(d2),
      dueDate: d2,
      priority: "medium",
      attachments: 2,
      status: "in-progress",
      className: "6-B",
      postedBy: "Ms. Kapoor",
      createdAt: now - 1000 * 60 * 60 * 30,
    },
    {
      id: "hw3",
      subject: "English",
      title: "Read Chapter 7 & answer Qs",
      due: formatDueLabel(d3),
      dueDate: d3,
      priority: "low",
      attachments: 0,
      status: "pending",
      className: "6-B",
      postedBy: "Ms. Kapoor",
      createdAt: now - 1000 * 60 * 60 * 40,
    },
    {
      id: "hw4",
      subject: "Hindi",
      title: "निबंध — मेरा विद्यालय",
      due: formatDueLabel(d0),
      dueDate: d0,
      priority: "high",
      attachments: 0,
      status: "submitted",
      className: "6-B",
      postedBy: "Ms. Kapoor",
      createdAt: now - 1000 * 60 * 60 * 80,
    },
  ];
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeHomework(items: HomeworkItem[]): HomeworkItem[] {
  return items.map((h) => {
    const dueDate = h.dueDate || undefined;
    return {
      ...h,
      dueDate,
      due: dueDate ? formatDueLabel(dueDate, h.due) : h.due,
    };
  });
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function SchoolDataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, backend, ready: authReady } = useAuth();
  const [ready, setReady] = useState(false);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);

  const loadLocal = useCallback(() => {
    const seeded = localStorage.getItem(SEEDED_KEY);
    if (!seeded) {
      const c = seedChats();
      const m = seedMessages();
      const n = seedNotifications();
      const h = seedHomework();
      saveJson(CHATS_KEY, c);
      saveJson(MSGS_KEY, m);
      saveJson(NOTIF_KEY, n);
      saveJson(HW_KEY, h);
      localStorage.setItem(SEEDED_KEY, "1");
      setChats(c);
      setMessagesByChat(m);
      setNotifications(n);
      setHomework(normalizeHomework(h));
    } else {
      setChats(loadJson(CHATS_KEY, seedChats()));
      setMessagesByChat(loadJson(MSGS_KEY, seedMessages()));
      setNotifications(loadJson(NOTIF_KEY, seedNotifications()));
      setHomework(normalizeHomework(loadJson(HW_KEY, seedHomework())));
    }
  }, []);

  const loadRemote = useCallback(async () => {
    const [chatsRes, notifRes, hwRes] = await Promise.all([
      apiFetch<{
        chats: ChatThread[];
        messagesByChat: Record<string, ChatMessage[]>;
      }>("/api/chats"),
      apiFetch<{ notifications: AppNotification[] }>("/api/notifications"),
      apiFetch<{ homework: HomeworkItem[] }>("/api/homework"),
    ]);
    setChats(sortChats(chatsRes.chats));
    setMessagesByChat((prev) => {
      const next = { ...chatsRes.messagesByChat };
      // Keep optimistic pending/failed local messages until server echoes them.
      for (const [chatId, list] of Object.entries(prev)) {
        const pending = list.filter((m) => m.pending || m.failed);
        if (!pending.length) continue;
        const server = next[chatId] || [];
        const serverTexts = new Set(server.map((m) => `${m.senderId}:${m.text}:${m.kind}`));
        const stillLocal = pending.filter(
          (m) => !serverTexts.has(`${m.senderId}:${m.text}:${m.kind}`),
        );
        next[chatId] = [...server, ...stillLocal];
      }
      return next;
    });
    setNotifications(notifRes.notifications);
    setHomework(normalizeHomework(hwRes.homework));
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      try {
        if (backend && user?.schoolId) {
          await loadRemote();
        } else if (!backend) {
          loadLocal();
        } else {
          setChats([]);
          setMessagesByChat({});
          setNotifications([]);
          setHomework([]);
        }
      } catch {
        if (!cancelled && !backend) loadLocal();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, backend, user?.id, user?.schoolId, loadLocal, loadRemote]);

  // Soft realtime: poll while tab is visible (lightweight cadence).
  useEffect(() => {
    if (!backend || !user?.schoolId || !authReady) return;
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      void loadRemote().catch(() => undefined);
    };
    const onChats = pathname.startsWith("/chats");
    const timer = setInterval(tick, onChats ? 12_000 : 25_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [backend, user?.id, user?.schoolId, authReady, loadRemote, pathname]);

  const clearChatError = useCallback(() => setChatError(null), []);

  const refreshNotifications = useCallback(async () => {
    if (!backend) return;
    try {
      const nRes = await apiFetch<{ notifications: AppNotification[] }>(
        "/api/notifications",
      );
      setNotifications(nRes.notifications);
    } catch {
      /* ignore */
    }
  }, [backend]);

  const getMessages = useCallback(
    (chatId: string) => messagesByChat[chatId] || [],
    [messagesByChat],
  );

  const sendMessage: SchoolDataCtx["sendMessage"] = useCallback(
    async ({ chatId, text, kind = "text", user: actor, meta, syncHomework = true }) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      setChatError(null);

      if (backend) {
        const tempId = `temp-${crypto.randomUUID()}`;
        const optimistic: ChatMessage = {
          id: tempId,
          chatId,
          kind,
          text: trimmed,
          senderId: actor.id,
          senderName: actor.name,
          senderRole: actor.role,
          createdAt: Date.now(),
          pending: true,
          meta,
          readBy: [actor.id],
        };
        setMessagesByChat((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), optimistic],
        }));
        setChats((prev) =>
          sortChats(
            prev.map((c) =>
              c.id === chatId
                ? { ...c, lastMessageAt: optimistic.createdAt, unread: 0 }
                : c,
            ),
          ),
        );

        try {
          const res = await apiFetch<{
            message: ChatMessage;
            chat: ChatThread | null;
          }>(`/api/chats/${encodeURIComponent(chatId)}`, {
            method: "POST",
            body: JSON.stringify({
              text: trimmed,
              kind,
              meta,
              syncHomework,
            }),
          });
          setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: [
              ...(prev[chatId] || []).filter((m) => m.id !== tempId),
              res.message,
            ],
          }));
          if (res.chat) {
            setChats((prev) =>
              sortChats(prev.map((c) => (c.id === chatId ? res.chat! : c))),
            );
          }
          if (kind === "homework" || kind === "daily_activity" || kind === "progress") {
            const nRes = await apiFetch<{ notifications: AppNotification[] }>(
              "/api/notifications",
            );
            setNotifications(nRes.notifications);
          }
          if (syncHomework && kind === "homework") {
            const hRes = await apiFetch<{ homework: HomeworkItem[] }>(
              "/api/homework",
            );
            setHomework(normalizeHomework(hRes.homework));
          }
          return true;
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Message failed to send";
          setChatError(msg);
          setMessagesByChat((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((m) =>
              m.id === tempId ? { ...m, pending: false, failed: true } : m,
            ),
          }));
          return false;
        }
      }

      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        chatId,
        kind,
        text: trimmed,
        senderId: actor.id,
        senderName: actor.name,
        senderRole: actor.role,
        createdAt: Date.now(),
        meta,
        readBy: [actor.id],
      };

      setMessagesByChat((prev) => {
        const next = { ...prev, [chatId]: [...(prev[chatId] || []), msg] };
        saveJson(MSGS_KEY, next);
        return next;
      });

      setChats((prev) => {
        const next = sortChats(
          prev.map((c) =>
            c.id === chatId
              ? { ...c, lastMessageAt: msg.createdAt, unread: 0 }
              : c,
          ),
        );
        saveJson(CHATS_KEY, next);
        return next;
      });

      if (kind === "homework" || kind === "daily_activity" || kind === "progress") {
        const notif: AppNotification = {
          id: crypto.randomUUID(),
          title:
            kind === "homework"
              ? `Homework · ${meta?.subject || "Class"}`
              : kind === "daily_activity"
                ? `Daily activity · ${meta?.subject || "Class"}`
                : `Progress · ${meta?.subject || "Update"}`,
          body: trimmed.slice(0, 120),
          createdAt: Date.now(),
          read: false,
          type:
            kind === "homework"
              ? "homework"
              : kind === "daily_activity"
                ? "activity"
                : "progress",
          href: `/chats/${chatId}`,
        };
        setNotifications((prev) => {
          const next = [notif, ...prev];
          saveJson(NOTIF_KEY, next);
          return next;
        });
      }

      if (syncHomework && kind === "homework" && meta?.subject) {
        const dueDate =
          meta.due && /^\d{4}-\d{2}-\d{2}$/.test(meta.due)
            ? meta.due
            : addDaysIso(toIsoDate(), 2);
        const hw: HomeworkItem = {
          id: crypto.randomUUID(),
          subject: meta.subject,
          title: trimmed.replace(/^Homework posted:\s*/i, ""),
          dueDate,
          due: formatDueLabel(dueDate, meta.due || "This week"),
          priority: "medium",
          attachments: 0,
          status: meta.status || "pending",
          className: actor.className || "6-B",
          postedBy: actor.name,
          createdAt: Date.now(),
        };
        setHomework((prev) => {
          const next = [hw, ...prev];
          saveJson(HW_KEY, next);
          return next;
        });
      }
      return true;
    },
    [backend],
  );

  const markChatRead = useCallback(
    (chatId: string) => {
      if (backend) {
        void apiFetch(`/api/chats/${encodeURIComponent(chatId)}`, {
          method: "PATCH",
        }).catch(() => undefined);
      }
      setChats((prev) => {
        const next = prev.map((c) =>
          c.id === chatId ? { ...c, unread: 0 } : c,
        );
        if (!backend) saveJson(CHATS_KEY, next);
        return next;
      });
    },
    [backend],
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      if (backend) {
        void apiFetch(`/api/notifications/${encodeURIComponent(id)}`, {
          method: "PATCH",
        }).catch(() => undefined);
      }
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        if (!backend) saveJson(NOTIF_KEY, next);
        return next;
      });
    },
    [backend],
  );

  const markAllNotificationsRead = useCallback(() => {
    if (backend) {
      void apiFetch("/api/notifications/read-all", { method: "POST" }).catch(
        () => undefined,
      );
    }
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      if (!backend) saveJson(NOTIF_KEY, next);
      return next;
    });
  }, [backend]);

  const addHomework = useCallback(
    (item: Omit<HomeworkItem, "id" | "createdAt">, actor: UserProfile) => {
      if (backend) {
        void (async () => {
          try {
            const res = await apiFetch<{ homework: HomeworkItem }>(
              "/api/homework",
              {
                method: "POST",
                body: JSON.stringify({ ...item, syncChat: true }),
              },
            );
            setHomework((prev) =>
              normalizeHomework([res.homework, ...prev.filter((h) => h.id !== res.homework.id)]),
            );
            const [chatsRes, notifRes] = await Promise.all([
              apiFetch<{
                chats: ChatThread[];
                messagesByChat: Record<string, ChatMessage[]>;
              }>("/api/chats"),
              apiFetch<{ notifications: AppNotification[] }>(
                "/api/notifications",
              ),
            ]);
            setChats(sortChats(chatsRes.chats));
            setMessagesByChat(chatsRes.messagesByChat);
            setNotifications(notifRes.notifications);
          } catch {
            /* ignore */
          }
        })();
        return;
      }

      const dueDate =
        item.dueDate ||
        (item.due && /^\d{4}-\d{2}-\d{2}$/.test(item.due)
          ? item.due
          : addDaysIso(toIsoDate(), 2));
      const hw: HomeworkItem = {
        ...item,
        dueDate,
        due: formatDueLabel(dueDate, item.due),
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };

      setHomework((prev) => {
        const next = [hw, ...prev];
        saveJson(HW_KEY, next);
        return next;
      });

      setChats((prevChats) => {
        const classChat = prevChats.find((c) => c.kind === "class") || prevChats[0];
        if (classChat) {
          sendMessage({
            chatId: classChat.id,
            text: `Homework posted: ${hw.title}`,
            kind: "homework",
            user: actor,
            meta: {
              subject: hw.subject,
              due: hw.due,
              status: hw.status,
            },
            syncHomework: false,
          });
        }
        return prevChats;
      });

      setNotifications((prev) => {
        const next: AppNotification[] = [
          {
            id: crypto.randomUUID(),
            title: `New homework · ${hw.subject}`,
            body: `${hw.title} · Submit by ${hw.due}${hw.dueDate ? ` (${hw.dueDate})` : ""}`,
            createdAt: Date.now(),
            read: false,
            type: "homework",
            href: "/homework",
          },
          ...prev,
        ];
        saveJson(NOTIF_KEY, next);
        return next;
      });
    },
    [backend, sendMessage],
  );

  const updateHomeworkStatus = useCallback(
    (id: string, status: HomeworkStatus, actor: UserProfile) => {
      if (backend) {
        void apiFetch(`/api/homework/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }).catch(() => undefined);
      }
      setHomework((prev) => {
        const next = prev.map((h) => (h.id === id ? { ...h, status } : h));
        if (!backend) saveJson(HW_KEY, next);
        const item = next.find((h) => h.id === id);
        if (item && !backend) {
          setNotifications((prevN) => {
            const n: AppNotification[] = [
              {
                id: crypto.randomUUID(),
                title: `Homework ${status}`,
                body: `${item.subject}: ${item.title} marked ${status} by ${actor.name}`,
                createdAt: Date.now(),
                read: false,
                type: "homework",
                href: "/homework",
              },
              ...prevN,
            ];
            saveJson(NOTIF_KEY, n);
            return n;
          });
        }
        return next;
      });
    },
    [backend],
  );

  const upsertChat = useCallback(
    (chat: ChatThread) => {
      if (backend) {
        void apiFetch("/api/chats", {
          method: "POST",
          body: JSON.stringify({
            slug: chat.id,
            title: chat.title,
            subtitle: chat.subtitle,
            kind: chat.kind,
            className: chat.className,
            avatar: chat.avatar,
          }),
        }).catch(() => undefined);
      }
      setChats((prev) => {
        const exists = prev.some((c) => c.id === chat.id);
        const next = exists
          ? prev.map((c) => (c.id === chat.id ? { ...c, ...chat } : c))
          : [chat, ...prev];
        if (!backend) saveJson(CHATS_KEY, next);
        return next;
      });
      setMessagesByChat((prev) => {
        if (prev[chat.id]) return prev;
        const next = {
          ...prev,
          [chat.id]: [
            {
              id: crypto.randomUUID(),
              chatId: chat.id,
              kind: "system" as const,
              text: `Chat started with ${chat.title}. Share updates about the student here.`,
              senderId: "school",
              senderName: "SchoolConnect",
              senderRole: "school" as const,
              createdAt: Date.now(),
            },
          ],
        };
        if (!backend) saveJson(MSGS_KEY, next);
        return next;
      });
    },
    [backend],
  );

  const pushNotification = useCallback(
    (input: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      if (backend) {
        void (async () => {
          try {
            const res = await apiFetch<{ notification: AppNotification }>(
              "/api/notifications",
              {
                method: "POST",
                body: JSON.stringify(input),
              },
            );
            setNotifications((prev) => [res.notification, ...prev]);
          } catch {
            /* ignore */
          }
        })();
        return;
      }
      const notif: AppNotification = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        read: false,
      };
      setNotifications((prev) => {
        const next = [notif, ...prev];
        saveJson(NOTIF_KEY, next);
        return next;
      });
    },
    [backend],
  );

  const value = useMemo<SchoolDataCtx>(
    () => ({
      ready,
      chats: sortChats(chats),
      messagesByChat,
      notifications: [...notifications].sort((a, b) => b.createdAt - a.createdAt),
      homework: [...homework].sort((a, b) => b.createdAt - a.createdAt),
      unreadNotifications: notifications.filter((n) => !n.read).length,
      unreadChats: chats.reduce((sum, c) => sum + c.unread, 0),
      chatError,
      clearChatError,
      refreshNotifications,
      getMessages,
      sendMessage,
      markChatRead,
      markNotificationRead,
      markAllNotificationsRead,
      addHomework,
      updateHomeworkStatus,
      canPostAsTeacher,
      upsertChat,
      pushNotification,
    }),
    [
      ready,
      chats,
      messagesByChat,
      notifications,
      homework,
      chatError,
      clearChatError,
      refreshNotifications,
      getMessages,
      sendMessage,
      markChatRead,
      markNotificationRead,
      markAllNotificationsRead,
      addHomework,
      updateHomeworkStatus,
      upsertChat,
      pushNotification,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSchoolData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSchoolData must be used inside SchoolDataProvider");
  return ctx;
}

export function formatChatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export const MESSAGE_KIND_LABEL: Record<MessageKind, string> = {
  text: "Message",
  daily_activity: "Daily activity",
  homework: "Homework",
  progress: "Progress",
  system: "System",
};
