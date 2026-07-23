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
import type { Role, UserProfile } from "@/lib/auth";
import { addDaysIso, formatDueLabel, toIsoDate } from "@/lib/dates";

export type MessageKind =
  | "text"
  | "daily_activity"
  | "homework"
  | "progress"
  | "system";

export type HomeworkStatus = "pending" | "in-progress" | "submitted" | "reviewed";
export type HomeworkPriority = "high" | "medium" | "low";

export interface ChatMessage {
  id: string;
  chatId: string;
  kind: MessageKind;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: Role | "school";
  createdAt: number;
  meta?: {
    subject?: string;
    due?: string;
    status?: HomeworkStatus;
    score?: string;
    activityDate?: string;
  };
}

export interface ChatThread {
  id: string;
  title: string;
  subtitle: string;
  kind: "class" | "teacher" | "school" | "bus";
  className?: string;
  avatar: string;
  pinned?: boolean;
  muted?: boolean;
  lastMessageAt: number;
  unread: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  type: "homework" | "activity" | "progress" | "fees" | "circular" | "chat" | "system";
  href?: string;
}

export interface HomeworkItem {
  id: string;
  subject: string;
  title: string;
  /** Human label e.g. Tomorrow — derived from dueDate when possible */
  due: string;
  /** ISO submission deadline YYYY-MM-DD */
  dueDate?: string;
  priority: HomeworkPriority;
  attachments: number;
  status: HomeworkStatus;
  className: string;
  postedBy: string;
  createdAt: number;
  notes?: string;
}

interface SchoolDataCtx {
  ready: boolean;
  chats: ChatThread[];
  messagesByChat: Record<string, ChatMessage[]>;
  notifications: AppNotification[];
  homework: HomeworkItem[];
  unreadNotifications: number;
  unreadChats: number;
  getMessages: (chatId: string) => ChatMessage[];
  sendMessage: (input: {
    chatId: string;
    text: string;
    kind?: MessageKind;
    user: UserProfile;
    meta?: ChatMessage["meta"];
    syncHomework?: boolean;
  }) => void;
  markChatRead: (chatId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addHomework: (item: Omit<HomeworkItem, "id" | "createdAt">, user: UserProfile) => void;
  updateHomeworkStatus: (id: string, status: HomeworkStatus, user: UserProfile) => void;
  canPostAsTeacher: (user: UserProfile | null) => boolean;
  upsertChat: (chat: ChatThread) => void;
}

const CHATS_KEY = "sc_chats_v1";
const MSGS_KEY = "sc_messages_v1";
const NOTIF_KEY = "sc_notifications_v1";
const HW_KEY = "sc_homework_v1";
const SEEDED_KEY = "sc_school_seeded_v1";

const Ctx = createContext<SchoolDataCtx | null>(null);

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
  const [ready, setReady] = useState(false);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);

  useEffect(() => {
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
    setReady(true);
  }, []);

  const getMessages = useCallback(
    (chatId: string) => messagesByChat[chatId] || [],
    [messagesByChat],
  );

  const sendMessage: SchoolDataCtx["sendMessage"] = useCallback(
    ({ chatId, text, kind = "text", user, meta, syncHomework = true }) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        chatId,
        kind,
        text: trimmed,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        createdAt: Date.now(),
        meta,
      };

      setMessagesByChat((prev) => {
        const next = { ...prev, [chatId]: [...(prev[chatId] || []), msg] };
        saveJson(MSGS_KEY, next);
        return next;
      });

      setChats((prev) => {
        const next = prev.map((c) =>
          c.id === chatId ? { ...c, lastMessageAt: msg.createdAt, unread: 0 } : c,
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
          className: user.className || "6-B",
          postedBy: user.name,
          createdAt: Date.now(),
        };
        setHomework((prev) => {
          const next = [hw, ...prev];
          saveJson(HW_KEY, next);
          return next;
        });
      }
    },
    [],
  );

  const markChatRead = useCallback((chatId: string) => {
    setChats((prev) => {
      const next = prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c));
      saveJson(CHATS_KEY, next);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveJson(NOTIF_KEY, next);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveJson(NOTIF_KEY, next);
      return next;
    });
  }, []);

  const addHomework = useCallback(
    (item: Omit<HomeworkItem, "id" | "createdAt">, user: UserProfile) => {
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
            user,
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
    [sendMessage],
  );

  const updateHomeworkStatus = useCallback(
    (id: string, status: HomeworkStatus, user: UserProfile) => {
      setHomework((prev) => {
        const next = prev.map((h) => (h.id === id ? { ...h, status } : h));
        saveJson(HW_KEY, next);
        const item = next.find((h) => h.id === id);
        if (item) {
          setNotifications((prevN) => {
            const n: AppNotification[] = [
              {
                id: crypto.randomUUID(),
                title: `Homework ${status}`,
                body: `${item.subject}: ${item.title} marked ${status} by ${user.name}`,
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
    [],
  );

  const upsertChat = useCallback((chat: ChatThread) => {
    setChats((prev) => {
      const exists = prev.some((c) => c.id === chat.id);
      const next = exists
        ? prev.map((c) => (c.id === chat.id ? { ...c, ...chat } : c))
        : [chat, ...prev];
      saveJson(CHATS_KEY, next);
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
      saveJson(MSGS_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<SchoolDataCtx>(
    () => ({
      ready,
      chats: [...chats].sort((a, b) => b.lastMessageAt - a.lastMessageAt),
      messagesByChat,
      notifications: [...notifications].sort((a, b) => b.createdAt - a.createdAt),
      homework: [...homework].sort((a, b) => b.createdAt - a.createdAt),
      unreadNotifications: notifications.filter((n) => !n.read).length,
      unreadChats: chats.reduce((sum, c) => sum + c.unread, 0),
      getMessages,
      sendMessage,
      markChatRead,
      markNotificationRead,
      markAllNotificationsRead,
      addHomework,
      updateHomeworkStatus,
      canPostAsTeacher,
      upsertChat,
    }),
    [
      ready,
      chats,
      messagesByChat,
      notifications,
      homework,
      getMessages,
      sendMessage,
      markChatRead,
      markNotificationRead,
      markAllNotificationsRead,
      addHomework,
      updateHomeworkStatus,
      upsertChat,
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
